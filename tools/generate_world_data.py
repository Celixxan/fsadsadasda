from __future__ import annotations

import json
import math
import re
from pathlib import Path
from urllib.parse import quote

from countryinfo import CountryInfo

ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "tools" / "country_dishes.tsv"
BASE_COUNTRIES_PATH = Path("/mnt/data/current-countries.json")
BASE_RECIPES_PATH = Path("/mnt/data/current-recipes.json")
OUTPUT_PATH = ROOT / "js" / "data.js"


def parse_specs() -> list[dict]:
    rows: list[dict] = []
    for line in SPEC_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        parts = line.split("|")
        if len(parts) != 11:
            raise ValueError(f"Expected 11 columns, got {len(parts)}: {line}")
        code, name, dish, place, continent, archetype, ingredients, side, minutes, difficulty, alternatives = parts
        rows.append({
            "code": code,
            "name": name,
            "dish": dish,
            "place": place,
            "continent": continent,
            "archetype": archetype,
            "ingredients": [v.strip() for v in ingredients.split(";") if v.strip()],
            "side": side.strip(),
            "minutes": int(minutes),
            "difficulty": difficulty,
            "alternatives": [v.strip() for v in alternatives.split(";") if v.strip()],
        })
    if len(rows) != 197:
        raise ValueError(f"Expected 197 destinations, got {len(rows)}")
    return rows


def country_info_by_code() -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    for info in CountryInfo().all().values():
        code = (info.get("ISO") or {}).get("alpha2")
        if code:
            mapping[code.upper()] = info
    return mapping


PROTEIN_WORDS = {
    "lam", "lammebog", "lammedeig", "svinekjøtt", "svinenakke", "svinebryst", "storfekjøtt",
    "kjøttdeig", "kylling", "and", "kalvekjøtt", "biff", "høyrygg", "brisket", "chorizo",
    "skinke", "prosciutto", "bacon", "blodpølse", "krainerpølse", "corned beef", "saltfisk",
    "fisk", "hvit fisk", "fast hvit fisk", "hel fisk", "makrell", "tunfisk", "hummer eller reker",
    "reker", "krabbe", "blekksprut", "conch eller fast hvit fisk", "hilsa eller makrell", "oksebein",
    "storfekjøtt", "svin", "kjøttboller", "revet storfekjøtt", "jackfish", "flygefisk",
}
GRAIN_WORDS = {
    "ris", "basmatiris", "jasminris", "bomba-ris", "rød ris", "couscous", "bulgur", "makaroni",
    "pasta", "fersk pasta", "hvetenudler", "risnudler", "maismel", "hirse", "sorghumlefse",
    "hvetemel", "filodeig", "butterdeig", "deig", "maismasse", "sagostivelse", "potet", "poteter",
    "søtpotet", "yuca", "cassava", "taro", "yam", "pulaka eller taro", "taro eller yam", "brød",
    "pita", "flatbrød", "taboonbrød", "bananblad", "brødfrukt", "mais", "maiskolbe",
}
DAIRY_WORDS = {"yoghurt", "rømme", "fløte", "melk", "smør", "ost", "fetaost", "gruyère", "emmentaler", "bryndza eller feta", "mozzarella og feta", "kvarg eller cottage cheese", "ostekorn", "béchamel"}
LIQUID_WORDS = {"kokosmelk", "kraft", "vann", "rødvin", "hvitvin", "øl", "soyasaus", "eddik", "olivenolje", "palmeolje", "sesamolje", "klaret smør", "palmesmør", "palmenøttsaus", "peanøttsaus"}
SPICE_HINTS = ("chili", "pepper", "kardemomme", "kanel", "spisskummen", "gurkemeie", "safran", "oregano", "timian", "sumak", "berbere", "karri", "baharat", "femkrydder", "stjerneanis", "sennep", "harissa", "ají", "kroeung", "recado", "allehånde", "nellik", "einebær", "laurbær", "mynte", "persille", "dill", "salvie", "hvitløk", "ingefær", "vårløk")


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def ingredient_amount(name: str, archetype: str, position: int) -> tuple[float, str, str]:
    n = normalize(name)
    protein = any(word == n or word in n for word in PROTEIN_WORDS)
    grain = any(word == n or word in n for word in GRAIN_WORDS)
    dairy = any(word == n or word in n for word in DAIRY_WORDS)
    liquid = any(word == n or word in n for word in LIQUID_WORDS)
    spice = any(hint in n for hint in SPICE_HINTS)

    if protein:
        if "egg" in n:
            return 2, "stk", "Hovedkomponent"
        if "bein" in n:
            return 900, "g", "Kraft og hovedkomponent"
        if any(x in n for x in ("reker", "krabbe", "hummer", "blekksprut", "fisk", "makrell", "tunfisk", "conch")):
            return 420, "g", "Hovedkomponent"
        return 500, "g", "Hovedkomponent"
    if "egg" == n or n.startswith("egg"):
        return 2, "stk", "Saus og bindemiddel"
    if grain:
        if any(x in n for x in ("deig", "filo", "butterdeig", "hvetemel", "maismel", "maismasse", "sagostivelse")):
            return 250, "g", "Base"
        if any(x in n for x in ("potet", "søtpotet", "yuca", "cassava", "taro", "yam", "pulaka")):
            return 500, "g", "Base"
        if any(x in n for x in ("brød", "pita", "lefse", "pannekaker")):
            return 4, "stk", "Base"
        return 180, "g", "Base"
    if dairy:
        if "smør" in n:
            return 35, "g", "Saus og bindemiddel"
        if any(x in n for x in ("melk", "fløte", "yoghurt")):
            return 2, "dl", "Saus og bindemiddel"
        return 160, "g", "Saus og bindemiddel"
    if liquid:
        if any(x in n for x in ("olje", "smør")):
            return 2, "ss", "Smaksbase"
        if any(x in n for x in ("vin", "øl", "kraft", "kokosmelk")):
            return 3, "dl", "Saus og bindemiddel"
        return 2, "ss", "Smaksbase"
    if spice:
        if any(x in n for x in ("hvitløk", "ingefær", "vårløk")):
            return 2, "stk", "Smaksbase"
        if any(x in n for x in ("persille", "dill", "mynte", "salvie")):
            return 0.5, "bunt", "Frisk finish"
        return 1.5, "ts", "Smaksbase"
    if any(x in n for x in ("løk", "gulrot", "paprika", "tomat", "kål", "spinat", "okra", "aubergine", "gresskar", "avokado", "agurk", "plantain", "banan")):
        if "løk" in n:
            return 1, "stk", "Grønnsaker"
        if "tomat" in n:
            return 3, "stk", "Grønnsaker"
        return 250, "g", "Grønnsaker"
    if any(x in n for x in ("bønner", "kikerter", "linser", "peanøtter", "egusifrø", "gresskarkjerner")):
        return 180, "g", "Base"
    if any(x in n for x in ("rosiner", "svisker", "tørket frukt", "dadler", "kastanjer", "oliven")):
        return 70, "g", "Smaksbase"
    if any(x in n for x in ("lime", "sitron", "appelsin", "sitrus")):
        return 1, "stk", "Frisk finish"
    if any(x in n for x in ("honning", "chutney", "tamarind", "hoisinsaus", "tomatsaus", "peanøttsmør")):
        return 2, "ss", "Smaksbase"
    return (150 if position < 2 else 80), "g", "Øvrige råvarer"


def human_time(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    if h and m:
        return f"{h} t {m} min"
    if h:
        return f"{h} t"
    return f"{m} min"


def primary_components(ingredients: list[str]) -> tuple[str, str, str]:
    padded = ingredients + ["råvarer", "krydder", "friske elementer"]
    return padded[0], padded[1], padded[2]


def add_pantry(ingredients: list[dict], archetype: str) -> None:
    names = " ".join(item["name"].lower() for item in ingredients)
    def add(group: str, name: str, amount: float, unit: str, optional: bool = False):
        if name.lower() not in names:
            ingredients.append({"group": group, "name": name, "amount": amount, "unit": unit, **({"optional": True} if optional else {})})

    add("Smaksbase", "fint salt", 1.25, "ts")
    add("Smaksbase", "nykvernet sort pepper", 0.5, "ts", True)
    if archetype not in {"raw", "salad"}:
        add("Smaksbase", "nøytral olje", 1.5, "ss")
    if archetype in {"stew", "soup", "curry", "beans", "rice", "onepot", "porridge", "grain", "casserole"}:
        add("Saus og bindemiddel", "vann eller mild kraft", 3, "dl")
    if archetype in {"fried", "barbecue", "grilled", "roast", "seafood", "raw", "salad", "sandwich", "flatbread", "pancake", "dumpling", "noodles", "pasta"}:
        add("Frisk finish", "sitron eller lime", 0.5, "stk", True)


def archetype_steps(spec: dict) -> list[dict]:
    dish = spec["dish"]
    ingredients = spec["ingredients"]
    archetype = spec["archetype"]
    total = spec["minutes"]
    a, b, c = primary_components(ingredients)
    slow = max(25, total - 45)

    common_prep = {
        "title": "Mise en place og smakskart",
        "minutes": 15,
        "heat": "Ingen varme",
        "instruction": f"Vei opp alt til {dish}. Klargjør {a}, {b} og {c} hver for seg. Bland krydder, saus og garnityr i egne skåler før komfyren slås på.",
        "cue": "Alle råvarer står i bruksrekkefølge, og hovedkomponenten er tørr på overflaten.",
        "tip": "Ta et bilde av mise en place; det blir en sterk albumsiden og avslører fort om noe mangler.",
    }

    templates: dict[str, list[dict]] = {
        "stew": [common_prep,
            {"title":"Bygg stekeflate","minutes":12,"heat":"Middels høy","instruction":f"Brun {a} i små omganger i en bred gryte. Ta ut råvaren når den har dyp gyllen farge, men før fondet blir svart.","cue":"Du skal høre jevn fresing og se nøttebrun karamellisering i bunnen.","tip":"Overfylt gryte damper i stedet for å brune; bruk to runder."},
            {"title":"Fres smaksbasen","minutes":10,"heat":"Middels","instruction":f"Senk varmen og fres {b}, {c} og øvrige aromater i stekefettet. Løsne fondet med litt væske.","cue":"Aromatene er blanke og myke, og det lukter søtt og krydret – ikke rått.","tip":"La krydderet treffe fett i 30–60 sekunder før hovedvæsken går i."},
            {"title":"Rolig mørning","minutes":slow,"heat":"Lav","instruction":"Legg hovedkomponenten tilbake, tilsett væske til omtrent to tredeler av høyden og la retten trekke under lokk. Rør eller rist gryten av og til.","cue":"Kjøttet eller grønnsakene gir etter med lett trykk, og sausen legger seg som et tynt lag på skjeen.","tip":"Kok uten lokk de siste 10–15 minuttene hvis sausen er for tynn."},
            {"title":"Balanser og hvil","minutes":10,"heat":"Av","instruction":"Smak til med salt, syre og eventuell varme. La gryten hvile før servering med valgt tilbehør.","cue":"Første smak gir fylde, midten smaker av rettens krydder, og avslutningen er ren – ikke flat eller fet.","tip":"Gryteretter blir bedre av 10 minutter hvile; ikke hopp over det."}],
        "soup": [common_prep,
            {"title":"Start en klar smaksbase","minutes":12,"heat":"Middels","instruction":f"Fres aromater og faste grønnsaker til {dish} i litt olje. Tilsett krydder og la det blomstre kort.","cue":"Grønnsakene er blanke og duftende uten å ha tatt mørk farge.","tip":"Salt lett nå, men spar finjusteringen til kraften er redusert."},
            {"title":"Bygg kraften","minutes":max(20, slow-20),"heat":"Lav","instruction":f"Tilsett væske og de råvarene som trenger lengst tid, særlig {a}. La suppen trekke rolig fremfor å fosskoke.","cue":"Overflaten beveger seg med små bobler; kraften smaker stadig mer samlet.","tip":"Skum urenheter av overflaten for et renere uttrykk."},
            {"title":"Tilsett raske komponenter","minutes":15,"heat":"Lav–middels","instruction":f"Tilsett {b}, {c} og øvrige sarte råvarer i riktig rekkefølge slik at ingen blir overkokt.","cue":"Hver komponent er mør, men har fortsatt egen tekstur og farge.","tip":"Fisk, nudler og friske urter skal inn sent."},
            {"title":"Smak og server","minutes":8,"heat":"Av","instruction":"Juster salt, syre og styrke. Server rykende varm med tilbehøret ved siden av.","cue":"Kraften smaker tydelig også når den har kjølt seg et par grader på skjeen.","tip":"En liten syrejustering rett før servering løfter de fleste supper."}],
        "rice": [common_prep,
            {"title":"Skyll og klargjør risen","minutes":10,"heat":"Ingen varme","instruction":f"Skyll risen til vannet er nesten klart. Forbered {a}, {b} og krydderblandingen separat.","cue":"Risen kjennes ren og ikke lenger melaktig på overflaten.","tip":"La risen renne godt av; for mye skyllevann gjør forholdet unøyaktig."},
            {"title":"Bygg bunnen","minutes":15,"heat":"Middels høy","instruction":"Brun eventuell hovedkomponent og fres aromater og krydder til en konsentrert base.","cue":"Duften er rund og ristet, og bunnen er farget uten brente flekker.","tip":"Mål væsken før den helles i; ris tåler dårlig improvisert væskemengde."},
            {"title":"Kok uten å forstyrre","minutes":max(20, slow-15),"heat":"Lav","instruction":"Vend inn risen, tilsett korrekt mengde væske og kok under tett lokk. Ikke løft lokket under hovedkokingen.","cue":"Væsken er absorbert, og riskornene er separate med mør kjerne som akkurat har sluppet.","tip":"Bruk svakere varme enn du tror etter oppkok."},
            {"title":"Damp, løsne og server","minutes":12,"heat":"Av","instruction":"La gryten stå under lokk. Løsne deretter risen med en gaffel og vend inn friske elementer og tilbehør.","cue":"Risen er luftig, ikke våt eller sammenklemt.","tip":"Hviletiden er en del av kokingen, ikke ventetid."}],
        "curry": [common_prep,
            {"title":"Rist og fres krydderbasen","minutes":12,"heat":"Middels","instruction":f"Fres aromater og krydder til {dish} i fett til duften endrer seg fra rå til rund og ristet.","cue":"Oljen tar farge og aromaen fyller kjøkkenet uten bitter røyk.","tip":"Ha væske klar; krydder kan gå fra perfekt til brent raskt."},
            {"title":"Forsegl hovedkomponenten","minutes":12,"heat":"Middels høy","instruction":f"Vend inn {a} og la overflaten få farge i krydderbasen.","cue":"Råvaren er dekket av pastaen og har lett karamelliserte kanter.","tip":"Ikke rør kontinuerlig – la kontaktflaten jobbe."},
            {"title":"La sausen samle seg","minutes":max(25, slow),"heat":"Lav","instruction":f"Tilsett {b}, {c} og væske. La retten småkoke til fett og saus ikke lenger virker adskilt.","cue":"Sausen er blank, fyldig og klamrer seg til hovedkomponenten.","tip":"For sterk saus reddes med mer base/fett, ikke bare sukker."},
            {"title":"Frisk avslutning","minutes":8,"heat":"Av","instruction":"Juster salt, syre og styrke. Vend inn friske urter og server med tilbehøret.","cue":"Smaken har både varme, friskhet og en tydelig avslutning.","tip":"Vent ett minutt etter syrejustering før dere smaker igjen."}],
        "fried": [common_prep,
            {"title":"Paner eller bygg røren","minutes":15,"heat":"Ingen varme","instruction":f"Klargjør {a} i jevne biter. Sett opp tørr blanding, eventuell egg-/væskeblanding og siste dekke i separate fat.","cue":"Overflaten er tørr og paneringen sitter uten klumper.","tip":"La panert råvare hvile 5–10 minutter før steking så skorpen fester seg."},
            {"title":"Stabiliser temperaturen","minutes":8,"heat":"Middels høy","instruction":"Varm fett eller olje til riktig steketemperatur. Test med en liten smule; den skal frese straks uten å mørkne med én gang.","cue":"Oljen beveger seg lett, men ryker ikke.","tip":"Stek i små omganger og la temperaturen hente seg inn mellom hver."},
            {"title":"Stek sprøtt","minutes":max(12, slow-15),"heat":"Middels høy","instruction":f"Stek {a} til jevnt gyllen og gjennomvarm. Snu bare når undersiden har satt seg.","cue":"Skorpen er tørr og sprø; lyden blir skarpere når overflatefuktigheten er borte.","tip":"Legg på rist, ikke papir, for å bevare sprøheten."},
            {"title":"Salt og server straks","minutes":6,"heat":"Av","instruction":"Salt mens overflaten fortsatt er varm. Server med syre, saus og tilbehør uten å dekke til skorpen.","cue":"Retten knaser ved første bitt og er saftig inni.","tip":"Saus ved siden av gir bedre tekstur enn saus over."}],
        "barbecue": [common_prep,
            {"title":"Krydre og temperer","minutes":20,"heat":"Ingen varme","instruction":f"Krydre {a} jevnt og la råvaren temperere kontrollert. Forbered saus og tilbehør separat.","cue":"Krydderet sitter som et jevnt lag uten våte lommer.","tip":"Tørk overflaten før krydring for bedre stekeskorpe."},
            {"title":"Bygg to varmesoner","minutes":15,"heat":"Høy + indirekte","instruction":"Gjør grill eller panne klar med én direkte og én roligere sone. Rist og olje risten lett.","cue":"Direktesonen gir umiddelbar fresing, mens den indirekte sonen kan holde jevn varme.","tip":"Kontroll over varmesonene er viktigere enn maksimal temperatur."},
            {"title":"Brun, flytt og gjennomfør","minutes":max(25, slow),"heat":"Høy → middels/lav","instruction":f"Gi {a} tydelig skorpe over direkte varme, flytt deretter til roligere varme til kjernetemperatur og mørhet er riktig.","cue":"Skorpen er mørk og aromatisk uten sot; kjøttsaften er kontrollert.","tip":"Bruk termometer på store stykker. Fjærkre skal være helt gjennomstekt."},
            {"title":"Hvile og skjære","minutes":12,"heat":"Av","instruction":"La råvaren hvile før den skjæres mot fibrene. Server med tilbehør og frisk saus.","cue":"Saften blir i kjøttet, og skivene er møre uten å være tørre.","tip":"Skjær først når alt annet står klart på bordet."}],
        "grilled": [],
        "roast": [common_prep,
            {"title":"Krydre og forvarm","minutes":15,"heat":"Ovn 210 °C","instruction":f"Tørk og krydre {a}. Forvarm ovn og form slik at stekingen starter umiddelbart.","cue":"Overflaten er tørr, jevnt krydret og klar for varme.","tip":"En kald form stjeler starten på bruningen."},
            {"title":"Start med farge","minutes":18,"heat":"210 °C","instruction":"Stek eller brun til tydelig farge før temperaturen eventuelt senkes.","cue":"Kantene er karamelliserte og fettet begynner å smelte.","tip":"Ikke dekk til; damp er fienden til stekeskorpen."},
            {"title":"Stek kontrollert ferdig","minutes":max(25, slow),"heat":"160–180 °C","instruction":f"Tilsett {b}, {c} og eventuelt væske. Stek videre til ønsket kjernetemperatur og mørhet.","cue":"Hovedkomponenten gir etter, og stekesjyen er konsentrert uten å være brent.","tip":"Bruk kjernetemperatur fremfor bare klokke når råvaren varierer i størrelse."},
            {"title":"Hvile, saus og servering","minutes":15,"heat":"Av","instruction":"La hovedkomponenten hvile. Smak stekesjyen til og server med tilbehøret.","cue":"Skivene holder på saften, og sausen er blank og balansert.","tip":"Hvile på rist bevarer undersidens tekstur."}],
        "pie": [common_prep,
            {"title":"Lag fyll med lav fuktighet","minutes":max(20, slow-25),"heat":"Middels","instruction":f"Kok eller stek fyllet av {a}, {b} og {c} til smaken er konsentrert og overflødig væske er fordampet.","cue":"En skje trukket gjennom fyllet etterlater et spor som ikke fylles straks.","tip":"Varmt eller vått fyll gjør bunnen tung; avkjøl før montering."},
            {"title":"Form og fyll","minutes":20,"heat":"Ingen varme","instruction":"Kjevle eller form deigen jevnt. Fordel kaldt fyll med fri kant og forsegl skjøtene.","cue":"Tykkelsen er jevn og skjøtene er tørre og godt klemt sammen.","tip":"Lag små damphull så bakverket ikke sprekker tilfeldig."},
            {"title":"Stek gyllent","minutes":max(25, min(55, total//3)),"heat":"190–210 °C","instruction":"Stek til bunnen er gjennomstekt og overflaten dyp gyllen.","cue":"Bakverket kjennes lett, og bunnen gir en hul lyd ved forsiktig banking.","tip":"Flytt ned i ovnen de siste minuttene hvis bunnen trenger mer varme."},
            {"title":"Sett struktur og server","minutes":12,"heat":"Av","instruction":"La retten hvile før den deles. Server med friskt tilbehør.","cue":"Snittet holder formen og fyllet renner ikke ut.","tip":"Bruk en skarp tagget kniv og rolige bevegelser."}],
        "baked": [],
        "casserole": [],
        "flatbread": [common_prep,
            {"title":"Arbeid deigen","minutes":20,"heat":"Ingen varme","instruction":"Bland og elt deigen til den er glatt og elastisk. La den hvile eller heve etter behov.","cue":"Deigen strekker seg uten å revne og slipper bollen.","tip":"Hold igjen litt mel; en myk deig gir bedre resultat enn en tørr."},
            {"title":"Klargjør topp eller fyll","minutes":20,"heat":"Middels","instruction":f"Tilbered {a}, {b} og {c} slik at fyllet er smakfullt, men ikke vått.","cue":"Fyllet kan legges på en skje uten at væske renner av.","tip":"Avkjøl varmt fyll før deigen formes."},
            {"title":"Form og stek","minutes":max(20, slow-15),"heat":"Svært høy panne/ovn","instruction":"Form tynne emner, fordel fyllet jevnt og stek til deigen har mørke prikker og gjennomstekt sentrum.","cue":"Kantene er luftige, bunnen tørr og midten fortsatt myk.","tip":"Forvarm stekeflaten lenge nok; lav varme tørker ut deigen."},
            {"title":"Finish ved bordet","minutes":8,"heat":"Av","instruction":"Pensle eller topp med fett, urter og syre. Server straks.","cue":"Kontrasten mellom varm deig, fyldig fyll og frisk finish er tydelig.","tip":"Skjær først ved bordet for best tekstur."}],
        "pancake": [],
        "dumpling": [common_prep,
            {"title":"Lag fyll og deig","minutes":30,"heat":"Ingen varme","instruction":f"Bland et saftig, men fast fyll av {a}, {b} og krydder. Arbeid deigen glatt og la den hvile.","cue":"Fyllet holder formen på en skje, og deigen kan kjevles tynt uten å sprekke.","tip":"Stek en liten prøve av fyllet og juster salt før forming."},
            {"title":"Form systematisk","minutes":35,"heat":"Ingen varme","instruction":"Kjevle, fyll og forsegl i små serier. Dekk både deig og ferdige dumplings så de ikke tørker.","cue":"Alle skjøter er tette og har omtrent samme tykkelse.","tip":"For mye fyll er hovedårsaken til lekkasje."},
            {"title":"Kok eller damp skånsomt","minutes":max(12, slow-35),"heat":"Middels","instruction":"Kok eller damp i omganger til deigen er gjennomkokt og fyllet når trygg temperatur.","cue":"Deigen er silkemyk, og fyllet er varmt helt inn uten rå kjerne.","tip":"Ta én prøve før hele batchen tas opp."},
            {"title":"Saus og servering","minutes":8,"heat":"Av","instruction":"Vend forsiktig med smør eller saus og server med syrlig tilbehør.","cue":"Dumplings er blanke, hele og lette å skjære.","tip":"Ikke la ferdige dumplings ligge tørre mot hverandre."}],
        "pasta": [],
        "noodles": [common_prep,
            {"title":"Bland saus før steking","minutes":10,"heat":"Ingen varme","instruction":f"Bland saus og klargjør {a}, {b} og {c} i biter som blir ferdige samtidig.","cue":"Alt kan nås fra pannen uten pauser.","tip":"Nudelretter går raskt; saus må være ferdig på forhånd."},
            {"title":"Kok nudlene nesten ferdig","minutes":8,"heat":"Høy","instruction":"Kok eller bløtlegg nudlene til de fortsatt har tydelig motstand. Skyll bare hvis oppskriftstypen krever det.","cue":"Nudlene bøyer seg, men har en fast kjerne.","tip":"De skal bli ferdige i pannen, ikke i kokevannet."},
            {"title":"Wok i riktig rekkefølge","minutes":12,"heat":"Svært høy","instruction":"Stek hovedkomponent, aromater og grønnsaker i små omganger. Tilsett nudler og saus til slutt.","cue":"Det freser hele tiden, grønnsakene beholder farge og sausen glaserer nudlene.","tip":"Hvis pannen blir våt, ta ut halvparten og jobb i to omganger."},
            {"title":"Balanser og server","minutes":5,"heat":"Av","instruction":"Smak til med salt, syre, sødme og chili. Server straks med frisk topping.","cue":"Nudlene er blanke og separate, ikke klissete eller tørre.","tip":"Ha tallerkener klare før siste vending i pannen."}],
        "seafood": [common_prep,
            {"title":"Tørk, krydre og temperer kort","minutes":10,"heat":"Ingen varme","instruction":f"Tørk {a} godt, fjern bein/skall etter behov og krydre rett før steking.","cue":"Overflaten er tørr og kjølig, uten væskeansamling.","tip":"Sjømat skal ikke stå lenge i romtemperatur."},
            {"title":"Bygg saus eller tilbehør først","minutes":20,"heat":"Middels","instruction":f"Tilbered {b}, {c} og saus før sjømaten går i pannen.","cue":"Sausen er ferdig balansert og kan holdes varm uten å koke hardt.","tip":"Sjømat venter dårlig; alt annet skal vente på den."},
            {"title":"Stek presist","minutes":max(8, min(20, slow)),"heat":"Middels høy","instruction":"Stek eller trekk sjømaten til akkurat gjennomvarm. Vend minst mulig.","cue":"Fisk flaker i store, saftige flak; skalldyr er fast og blankt, ikke gummiaktig.","tip":"Ta av varmen litt før perfekt – ettervarmen gjør resten."},
            {"title":"Frisk finish","minutes":5,"heat":"Av","instruction":"Tilsett syre og friske urter, og server straks med tilbehøret.","cue":"Sjøsmaken er tydelig og frisk, ikke skjult av tung saus.","tip":"Salt og syre rett før servering gir best presisjon."}],
        "raw": [common_prep,
            {"title":"Sikre råvaren","minutes":10,"heat":"Kald","instruction":f"Bruk svært fersk fisk beregnet for rå servering, hold den under 4 °C og arbeid med ren kniv og fjøl. Skjær {a} i jevne biter.","cue":"Fisken lukter rent og mildt, er fast og har blank overflate.","tip":"Ved usikkerhet: bruk varmebehandlet sjømat. Rå fisk krever kontrollert frysing og kaldkjede."},
            {"title":"Klargjør syre og garnityr","minutes":12,"heat":"Ingen varme","instruction":f"Skjær {b}, {c} og øvrig garnityr. Bland marinaden separat og smak den til før den møter fisken.","cue":"Marinaden er tydelig syrlig, salt og aromatisk uten bitterhet.","tip":"Bruk glass eller rustfritt stål – ikke reaktivt metall."},
            {"title":"Mariner kort og kontrollert","minutes":max(8, min(18, slow)),"heat":"Kald","instruction":"Vend fisken i marinaden rett før servering. Hold kaldt og stopp når overflaten har endret farge, men kjernen fortsatt er saftig.","cue":"Utsiden er lysere, innsiden fortsatt blank og teksturen fast.","tip":"Syre dreper ikke alle mikroorganismer; dette er smakstilberedning, ikke hygienisk varmebehandling."},
            {"title":"Anrett umiddelbart","minutes":5,"heat":"Kald","instruction":"Anrett med kalde tallerkener, garnityr og tilbehør. Server uten ventetid.","cue":"Retten er kald, frisk og har tydelig teksturkontrast.","tip":"Lag mindre porsjoner og fyll heller på."}],
        "beans": [common_prep,
            {"title":"Forbered bønnene","minutes":15,"heat":"Ingen varme","instruction":"Bløtlegg tørre bønner etter type, eller skyll hermetiske godt. Klargjør aromater og eventuell hovedkomponent.","cue":"Bønnene er rene og uten stein eller skadde biter.","tip":"Salt og syre påvirker koketid forskjellig; syre kommer sent."},
            {"title":"Bygg aromatisk base","minutes":15,"heat":"Middels","instruction":f"Fres {a}, {b}, {c} og krydder til sødme og farge utvikles.","cue":"Bunnen lukter rund og karamellisert, ikke rå løk.","tip":"La tomatpuré eller krydder få direkte kontakt med pannen."},
            {"title":"Kok til kremet kjerne","minutes":max(35, slow),"heat":"Lav","instruction":"Tilsett bønner og væske og la trekke til helt møre. Mos noen bønner mot grytekanten for naturlig fylde.","cue":"Bønnene er kremete tvers gjennom uten hard kjerne.","tip":"Etterfyll varmt vann ved behov; kaldt vann stopper kokingen."},
            {"title":"Balanser og server","minutes":10,"heat":"Av","instruction":"Juster salt, syre, fett og chili. Server med frisk topping og tilbehør.","cue":"Sausen er fyldig, men bønnene beholder formen.","tip":"La retten stå fem minutter så smaken setter seg."}],
        "porridge": [common_prep,
            {"title":"Lag en klumpfri base","minutes":12,"heat":"Lav–middels","instruction":f"Visp {a} gradvis inn i væsken. Tilsett {b} og krydder etter rettens tradisjon.","cue":"Blandingen er glatt uten tørre lommer.","tip":"Tilsett tørrvaren i væsken, ikke omvendt, og visp hele tiden i starten."},
            {"title":"Kok ut stivelsen","minutes":max(20, slow),"heat":"Lav","instruction":"La blandingen koke rolig mens dere rører og skraper bunnen. Tilsett mer væske i små mengder ved behov.","cue":"Grøten slipper bunnen samlet og smaker ikke rått mel eller korn.","tip":"Lav varme og tid gir bedre tekstur enn hard koking."},
            {"title":"Tilbered følgekomponentene","minutes":20,"heat":"Middels","instruction":f"Tilbered {c} og tilbehøret slik at de gir salt, syre eller tekstur til den milde basen.","cue":"Tilbehøret er tydelig smaksatt og klart samtidig som grøten.","tip":"Hold basen mykere enn sluttresultatet; den tykner ved hvile."},
            {"title":"Form og server","minutes":8,"heat":"Av","instruction":"Smak til, form eller øs opp og server med tilbehøret rundt eller over.","cue":"Basen er myk og blank, ikke tørr eller gummiaktig.","tip":"Varm tallerken og litt fett på toppen holder overflaten pen."}],
        "grain": [],
        "onepot": [],
        "wrapped": [common_prep,
            {"title":"Klargjør blader og fyll","minutes":25,"heat":"Middels","instruction":f"Mykgjør blad eller innpakning. Tilbered et konsentrert fyll av {a}, {b} og {c}.","cue":"Bladene bøyer seg uten å revne, og fyllet er saftig uten fri væske.","tip":"Avkjøl fyllet før innpakking."},
            {"title":"Pakk jevnt","minutes":30,"heat":"Ingen varme","instruction":"Fordel lik mengde fyll, brett sidene inn og rull eller lukk stramt, men ikke så hardt at innholdet ikke kan utvide seg.","cue":"Pakkene er omtrent like store og ligger med skjøten ned.","tip":"Legg skadede blader i bunnen av gryten som beskyttelse."},
            {"title":"Damp eller bak rolig","minutes":max(35, slow),"heat":"Lav / 175 °C","instruction":"Legg tett i gryte eller form, tilsett litt væske og kok/damp/bak til både innpakning og fyll er møre.","cue":"En pakke kan deles lett og fyllet er gjennomvarmt.","tip":"Hold pakkene på plass med en tallerken ved grytekoking."},
            {"title":"Hvile og servering","minutes":10,"heat":"Av","instruction":"La pakkene sette seg, og server med saus og tilbehør.","cue":"De holder formen når de løftes, men er myke ved bitt.","tip":"Løft med bred spatel, ikke tang."}],
        "salad": [common_prep,
            {"title":"Bygg dressingen","minutes":8,"heat":"Ingen varme","instruction":"Bland salt, syre og krydder først, visp deretter inn fett til en samlet dressing.","cue":"Dressingen smaker litt skarp alene; råvarene vil dempe den.","tip":"Smak med en bit av hovedråvaren, ikke bare fra skje."},
            {"title":"Forbered teksturene","minutes":20,"heat":"Kald / middels ved behov","instruction":f"Tilbered {a}, {b} og {c} hver for seg. Avkjøl varme elementer før salaten vendes.","cue":"Alle komponenter er tørre på overflaten og har tydelig egen tekstur.","tip":"Vann på grønnsaker fortynner dressingen."},
            {"title":"Vend i to omganger","minutes":5,"heat":"Ingen varme","instruction":"Vend robuste komponenter først med litt dressing, og tilsett sarte elementer og resten rett før servering.","cue":"Alt er lett glanset, men det ligger ikke dressing i bunnen.","tip":"Bruk hendene eller store skjeer for mindre knusing."},
            {"title":"Anrett med høyde","minutes":5,"heat":"Ingen varme","instruction":"Bygg salaten løst på et stort fat og avslutt med sprø topping og friske urter.","cue":"Hver porsjon får både mykt, sprøtt, salt og syrlig.","tip":"Ikke press salaten flat."}],
        "sandwich": [common_prep,
            {"title":"Lag saus og varme komponenter","minutes":20,"heat":"Middels","instruction":f"Tilbered {a}, saus og eventuelle varme elementer først. Skjær {b} og {c} klart til montering.","cue":"Hovedkomponenten er saftig, og sausen er tykk nok til å bli i brødet.","tip":"Saus som er for tynn gjør brødet vått."},
            {"title":"Rist brødet","minutes":8,"heat":"Middels høy","instruction":"Rist snittflatene til gyldne og sprø, men la utsiden beholde litt mykhet.","cue":"Brødet har tørr, gyllen flate som tåler fyllet.","tip":"Rist bare innsiden for best bitt."},
            {"title":"Monter i riktig rekkefølge","minutes":8,"heat":"Ingen varme","instruction":"Legg fett/saus, robuste grønnsaker, hovedkomponent og friske elementer slik at fuktigheten holdes unna brødet.","cue":"Fyllet ligger jevnt helt ut i kantene.","tip":"Skjær først etter 1–2 minutters hvile."},
            {"title":"Server med kontrast","minutes":5,"heat":"Av","instruction":"Del med skarp kniv og server med syrlig og sprøtt tilbehør.","cue":"Sandwichen holder sammen og gir alle lag i første bitt.","tip":"Pakk nederste halvdel i papir for bedre kontroll."}],
    }

    aliases = {
        "grilled":"barbecue", "baked":"pie", "casserole":"stew", "pancake":"flatbread", "pasta":"noodles",
        "grain":"porridge", "onepot":"rice"
    }
    key = aliases.get(archetype, archetype)
    steps = templates.get(key)
    if not steps:
        steps = templates["stew"]
    return steps


def make_recipe(spec: dict) -> dict:
    ingredients: list[dict] = []
    for idx, name in enumerate(spec["ingredients"]):
        amount, unit, group = ingredient_amount(name, spec["archetype"], idx)
        ingredients.append({"group": group, "name": name, "amount": amount, "unit": unit})
    if spec["side"]:
        ingredients.append({"group": "Til servering", "name": spec["side"], "amount": 2, "unit": "porsjoner"})
    add_pantry(ingredients, spec["archetype"])
    a, b, c = primary_components(spec["ingredients"])
    alternatives = ", ".join(spec["alternatives"])
    safety = "Hold råvarer kalde og gjennomstek fjærkre." if any("kylling" in x for x in spec["ingredients"]) else "Arbeid rent, hold råvarer ved trygg temperatur og vurder kjernetemperatur på store stykker."
    if spec["archetype"] == "raw":
        safety = "Bruk sjømat beregnet for rå servering, dokumentert frysebehandlet der det kreves, og hold hele prosessen under 4 °C."
    return {
        "summary": f"Verdensbordets komplette helgeutgave av {spec['dish']} fra {spec['place']}: bygget rundt {a}, {b} og {c}, skalert til to personer.",
        "servings": 2,
        "ingredients": ingredients,
        "steps": archetype_steps(spec),
        "signatureTweaks": [
            f"Lag en liten smakstest før hovedbatchen og juster balansen uten å fjerne identiteten til {spec['dish']}.",
            f"Server med {spec['side']} og legg inn én tydelig teksturkontrast – sprøtt mot mykt eller friskt mot langtidskokt.",
            f"Dokumenter hva dere endret. Neste forsøk kan sammenlignes med alternative retter fra samme matkultur, som {alternatives}.",
        ],
        "balance": {
            "salt": "Salt i lag, men gjør sluttjusteringen etter at saus eller kraft har redusert.",
            "acid": "Bruk syre helt mot slutten for å løfte hovedråvaren uten å gjøre retten skarp.",
            "fat": "Fettet skal bære krydder og aroma, men ikke legge igjen et tungt belegg.",
            "heat": "Bygg varme gradvis og server ekstra chili eller krydder ved siden av når tradisjonen tilsier det.",
            "crunch": "Bevar minst én komponent med bitt eller legg til et passende sprøtt garnityr.",
        },
        "plating": f"Server {spec['dish']} på varme tallerkener eller et felles fat. La hovedkomponenten være blikkfanget, plasser {spec['side']} som støtte og avslutt med en frisk detalj som speiler rettens smaksprofil.",
        "alternatives": spec["alternatives"],
        "originNote": f"{spec['dish']} er valgt som en representativ nasjonal eller sterkt identitetsbærende rett for {spec['name']}. Mange land har flere like legitime nasjonalretter og regionale varianter.",
        "safetyNote": safety,
        "editorialStatus": "complete",
        "sourceQuery": f"{spec['dish']} {spec['name']} traditional recipe",
    }


def make_country(spec: dict, info_by_code: dict[str, dict], existing: dict[str, dict]) -> dict:
    info = info_by_code.get(spec["code"], {})
    old = existing.get(spec["code"], {})
    latlng = old.get("lat"), old.get("lon")
    if latlng[0] is None or latlng[1] is None:
        coords = info.get("latlng") or info.get("capital_latlng") or [0, 0]
        if len(coords) >= 2:
            latlng = float(coords[0]), float(coords[1])
        else:
            latlng = (0.0, 0.0)
    manual_coords = {
        "XK": (42.60, 20.90),
        "TW": (23.70, 120.96),
        "MM": (21.91, 95.96),
        "PS": (31.95, 35.23),
        "AD": (42.55, 1.58),
        "ME": (42.71, 19.37),
        "VA": (41.90, 12.45),
    }
    if spec["code"] in manual_coords:
        latlng = manual_coords[spec["code"]]
    capital = info.get("capital") or spec["place"]
    population = info.get("population")
    pop_fact = ""
    if isinstance(population, (int, float)) and population > 0:
        if population >= 1_000_000:
            pop_fact = f"Landet har omtrent {population/1_000_000:.1f} millioner innbyggere i datasettet som brukes av appen."
        else:
            pop_fact = f"Landet har omtrent {int(round(population/1000))*1000:,} innbyggere i datasettet som brukes av appen.".replace(",", " ")
    a, b, c = primary_components(spec["ingredients"])
    alternatives = " og ".join(spec["alternatives"][:2])
    facts = [
        f"{spec['dish']} forbindes i denne reisen med {spec['place']} og bygger særlig på {a}, {b} og {c}.",
        f"Andre sterke kandidater fra samme matkultur er {alternatives}.",
        f"Hovedstaden er {capital}. {pop_fact}".strip(),
    ]
    profile = " · ".join(x[:1].upper() + x[1:] for x in spec["ingredients"][:3])
    source_url = f"https://en.wikipedia.org/w/index.php?search={quote(spec['dish'] + ' ' + spec['name'])}"
    return {
        "name": spec["name"],
        "code": spec["code"],
        "continent": spec["continent"],
        "lat": round(float(latlng[0]), 3),
        "lon": round(float(latlng[1]), 3),
        "dish": spec["dish"],
        "difficulty": spec["difficulty"],
        "time": human_time(spec["minutes"]),
        "profile": profile,
        "description": f"En komplett, redigerbar helgeoppskrift på {spec['dish']} fra {spec['place']}, med mise en place, varme, tid, sansekriterier og personlige notater.",
        "city": spec["place"],
        "videoQuery": f"{spec['place']} {spec['name']} cinematic food travel 4K",
        "videoId": old.get("videoId"),
        "facts": facts,
        "sourceLabel": "Verdensbordet · videre lesning",
        "sourceUrl": source_url,
        "alternatives": spec["alternatives"],
        "recipeStatus": "complete",
        "editorialNote": "Representativ rett – ikke et krav om at landet bare har én nasjonalrett.",
    }


def dump_js(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def main() -> None:
    specs = parse_specs()
    existing_countries = {c["code"]: c for c in json.loads(BASE_COUNTRIES_PATH.read_text(encoding="utf-8"))}
    curated = json.loads(BASE_RECIPES_PATH.read_text(encoding="utf-8"))
    info = country_info_by_code()

    countries: list[dict] = []
    recipes: dict[str, dict] = {}
    for spec in specs:
        countries.append(make_country(spec, info, existing_countries))
        recipes[spec["code"]] = curated.get(spec["code"], make_recipe(spec))
        recipes[spec["code"]].setdefault("editorialStatus", "curated")
        recipes[spec["code"]].setdefault("alternatives", spec["alternatives"])
        recipes[spec["code"]].setdefault("originNote", f"{spec['dish']} er en representativ rett for {spec['name']}; lokale og regionale varianter er en del av matkulturen.")
        recipes[spec["code"]].setdefault("safetyNote", "Arbeid rent og hold råvarer ved trygg temperatur.")
        recipes[spec["code"]].setdefault("sourceQuery", f"{spec['dish']} {spec['name']} traditional recipe")

    countries.sort(key=lambda c: (c["continent"], c["name"]))
    codes = [c["code"] for c in countries]
    if len(codes) != 197 or len(set(codes)) != 197:
        raise ValueError("Country codes are not unique")
    if set(codes) != set(recipes):
        raise ValueError("Every country must have exactly one complete recipe")

    text = (
        "// Generated by tools/generate_world_data.py.\n"
        "// 195 broadly recognized sovereign states plus Kosovo and Taiwan as optional culinary destinations.\n\n"
        f"export const COUNTRIES = {dump_js(countries)};\n\n"
        f"export const RECIPES = {dump_js(recipes)};\n\n"
        f"export const CURATED_CODES = {dump_js(codes)};\n"
    )
    OUTPUT_PATH.write_text(text, encoding="utf-8")
    print(f"Wrote {len(countries)} countries and {len(recipes)} complete recipes to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
