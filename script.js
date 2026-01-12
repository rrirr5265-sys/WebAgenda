// Variables d'estat global
let dataReferencia = new Date(); 
let tasques = JSON.parse(localStorage.getItem("tasques_agenda")) || {};

// Selecció d'elements del DOM
const rangDatesText = document.getElementById("rang-dates-setmana");
const botonsNavegacio = document.querySelectorAll(".boto-navegacio");
const botoCrear = document.querySelector(".fab-boto-crear");
const botoCalendari = document.querySelector(".fab-boto-mes"); 
const celdesTasques = document.querySelectorAll("tbody td");
const capçaleresDies = document.querySelectorAll("thead tr:nth-child(2) th");

function inicialitzaEvents() {
    botonsNavegacio[0].addEventListener("click", () => canviarSetmana(-7));
    botonsNavegacio[1].addEventListener("click", () => canviarSetmana(7));

    botoCrear.addEventListener("click", () => {
        const descripcio = prompt("Introdueix la nova tasca:");
        if (descripcio) afegirTasca(descripcio);
    });

    // Selector de data per anar a qualsevol any (fins i tot el 1582!)
    const selectorData = document.createElement("input");
    selectorData.type = "date";
    selectorData.style.display = "none";
    document.body.appendChild(selectorData);

    botoCalendari.addEventListener("click", () => {
        selectorData.showPicker(); 
    });

    selectorData.addEventListener("change", (e) => {
        if (e.target.value) {
            dataReferencia = new Date(e.target.value);
            actualitzarCalendari();
        }
    });
}

function guardarACache() {
    localStorage.setItem("tasques_agenda", JSON.stringify(tasques));
}

function canviarSetmana(dies) {
    dataReferencia.setDate(dataReferencia.getDate() + dies);
    actualitzarCalendari();
}

function obtenirDilluns(data) {
    const d = new Date(data);
    const diaSetmana = d.getDay(); // 0 (dg) a 6 (ds)
    // Ajustem per obtenir el dilluns de la setmana actual
    const diferencia = d.getDate() - (diaSetmana === 0 ? 6 : diaSetmana - 1);
    const dilluns = new Date(d.setDate(diferencia));
    dilluns.setHours(0, 0, 0, 0);
    return dilluns;
}

function actualitzarCalendari() {
    const avui = new Date();
    const dilluns = obtenirDilluns(dataReferencia);
    const diumenge = new Date(dilluns);
    diumenge.setDate(dilluns.getDate() + 6);

    const opcionsMes = { month: 'long' };
    const mesInici = dilluns.toLocaleDateString('ca-ES', opcionsMes);
    const mesFi = diumenge.toLocaleDateString('ca-ES', opcionsMes);
    const anyInici = dilluns.getFullYear();
    const anyFi = diumenge.getFullYear();

    // Gestió del rang d'anys i mesos
    let textRang = "";
    if (anyInici !== anyFi) {
        textRang = `${dilluns.getDate()} de ${mesInici} (${anyInici}) - ${diumenge.getDate()} de ${mesFi} (${anyFi})`;
    } else if (mesInici !== mesFi) {
        textRang = `${dilluns.getDate()} de ${mesInici} - ${diumenge.getDate()} de ${mesFi} de ${anyInici}`;
    } else {
        textRang = `${dilluns.getDate()} - ${diumenge.getDate()} de ${mesInici} de ${anyInici}`;
    }
    
    rangDatesText.innerHTML = `<b>${textRang}</b>`;

    const nomsDies = ["DILLUNS", "DIMARTS", "DIMECRES", "DIJOUS", "DIVENDRES", "DISSABTE", "DIUMENGE"];
    
    capçaleresDies.forEach((th, index) => {
        const diaActualCelda = new Date(dilluns);
        diaActualCelda.setDate(dilluns.getDate() + index);
        const esAvui = diaActualCelda.toDateString() === avui.toDateString();

        th.innerHTML = `${nomsDies[index]} (${diaActualCelda.getDate()})`;
        th.style.color = esAvui ? "#3498db" : "#2c3e50";
        th.style.backgroundColor = esAvui ? "#ebf5fb" : "#f4f6f8";
        th.style.borderBottom = esAvui ? "3px solid #3498db" : "1px solid #dee2e6";
    });

    celdesTasques.forEach((celda, index) => {
        const diaActualCelda = new Date(dilluns);
        diaActualCelda.setDate(dilluns.getDate() + index);
        const dataClau = diaActualCelda.toISOString().split('T')[0];

        celda.innerHTML = ""; 
        celda.style.verticalAlign = "top";
        celda.style.minHeight = "120px";

        if (tasques[dataClau]) {
            tasques[dataClau].forEach((tasca, i) => {
                const divTasca = document.createElement("div");
                divTasca.style.cssText = "background:#d1edda; margin:5px 0; padding:8px; border-radius:4px; font-size:0.85em; border-left:4px solid #2ecc71; text-align: left; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";
                divTasca.textContent = tasca;
                
                divTasca.onclick = () => {
                    if(confirm("Vols esborrar aquesta tasca?")) {
                        tasques[dataClau].splice(i, 1);
                        guardarACache();
                        actualitzarCalendari();
                    }
                };
                celda.appendChild(divTasca);
            });
        }
    });
}

function afegirTasca(contingut) {
    const diaInput = prompt("A quin dia de la setmana vols afegir-la?\n(1:Dilluns, 7:Diumenge)", "1");
    const index = parseInt(diaInput) - 1;

    if (index >= 0 && index < 7) {
        const dilluns = obtenirDilluns(dataReferencia);
        const diaElegit = new Date(dilluns);
        diaElegit.setDate(dilluns.getDate() + index);
        const dataClau = diaElegit.toISOString().split('T')[0];

        if (!tasques[dataClau]) tasques[dataClau] = [];
        tasques[dataClau].push(contingut);
        
        guardarACache();
        actualitzarCalendari();
    }
}

inicialitzaEvents();
actualitzarCalendari();