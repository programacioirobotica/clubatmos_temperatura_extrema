# Club ATMOS · Laboratori de la temperatura

Aplicació web interactiva (en català) per a la **Investigació 2 · Augment de temperatura al planeta**
de *Robots en Acció!*. És una **introducció prèvia** a la investigació, neutra pel que fa al material: no
depèn de cap dispositiu ni de cap kit concret.

Mateixa arquitectura que `clubatmos_el_so`: **Vite + JavaScript pur**, sense frameworks, desplegat a
**GitHub Pages** amb GitHub Actions.

## Què hi ha dins

| Secció | Contingut |
|---|---|
| **Inici** | Termòmetre simulat en directe i presentació de la missió |
| **El Club** | Nitro, Link, Eko i Bio + el mètode científic en 5 passos |
| **Aprèn** | 3 simulacions amb hipòtesi prèvia: efecte hivernacle, temps vs. clima, temperatura i confort |
| **Experimenta** | Menjador virtual amb un termòmetre: lloc i hora; hipòtesi → prova → conclusió |
| **Energia** | Idea clau: combustibles fòssils vs. aprofitar el vent |
| **Conseqüències** | Dades NASA/NOAA/IPCC, cercle de l'aire condicionat, escenaris |
| **Missió** | Fer retrocedir l'Ombra: baixar les emissions del barri de Brisa del 100 % al ≤ 62 % amb 3 accions i 7 punts, + pregunta final |

Aquesta web és una **introducció prèvia**: engancha l'alumnat amb la temàtica i les simulacions, abans de fer les activitats de la investigació.

El progrés (7 fites) es mostra a la capçalera. No es desa res al servidor.

## Estructura

```
index.html              Tot el contingut (HTML semàntic, ca)
src/
  main.js               Punt d'entrada (importa tot i controla el diàleg d'inici)
  style.css             Sistema de disseny base (variables, capçalera, seccions)
  components.css        Components propis d'aquesta web
  utils.js              Utilitats: $, fmt, progrés, sons Web Audio, zones de temperatura
  hero.js               Canvas i temperatura simulada de la portada
  foundations.js        Simulacions d'«Aprèn»
  lab.js                Menjador virtual amb un termòmetre
  mission.js            Missió final i pregunta de tancament
public/assets/          Imatges (WebP) i logos (les atmos-*.webp les poses tu)
.github/workflows/      Desplegament automàtic a GitHub Pages
```

## Posar-ho en marxa en local

Cal Node 20 o superior (el workflow usa Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
npm run preview    # serveix dist/ per comprovar-ho
```

## Publicar-ho a GitHub (igual que el repositori de mostra)

1. Crea un repositori nou a la teva organització/compte, per exemple `clubatmos_la_temperatura`.
2. Puja-hi **tots** aquests fitxers (inclòs `package-lock.json` i la carpeta `.github/`).
   No pugis `node_modules/` ni `dist/` (ja són al `.gitignore`).
   ```bash
   git init
   git add .
   git commit -m "Primera versió"
   git branch -M main
   git remote add origin https://github.com/EL_TEU_USUARI/clubatmos_la_temperatura.git
   git push -u origin main
   ```
3. Al repositori: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Cada `push` a `main` desplega la web a `https://EL_TEU_USUARI.github.io/NOM_DEL_REPO/`.
   La ruta base es calcula sola a partir del nom del repositori (`vite.config.js`), així que
   no cal tocar res si canvies el nom.

## Imatges

Totes les imatges són a `public/assets/` (format WebP):

- Escenes (1280×720): `atmos-01.webp` … `atmos-10.webp`
- Retrats (512×512): `atmos-nitro.webp`, `atmos-link.webp`, `atmos-eko.webp`, `atmos-bio.webp`
- Marca: `club-atmos.webp`, `robots-en-accio.webp`, `rea-logo.webp`

Per canviar-ne una, substitueix el fitxer amb **el mateix nom** i fes `push`.

## Adaptar el contingut

- **Textos**: tot és a `index.html`.
- **Dades de les simulacions**: constants a dalt de cada mòdul (`GH_STEPS` i `DECADES` a
  `foundations.js`; `WEEK` i `CLIMATE` a `activities.js`; `START/TARGET/BUDGET` a `mission.js`).
- **Mesures de la missió**: els botons `#measures button` porten `data-reduction` i `data-cost`.
- **Colors**: variables CSS a l'inici de `src/style.css`.

## Notes sobre les dades

Les dades de temperatura i CO₂ són les de la NASA/NOAA amb la mitjana **1951–1980** com a referència
(alguns materials parlen només de «segle XX», que és menys precís).

## Accessibilitat

Navegació amb teclat, etiquetes ARIA als controls, `prefers-reduced-motion` respectat, les animacions
de canvas només corren quan són visibles.
