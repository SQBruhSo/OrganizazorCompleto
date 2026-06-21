document.addEventListener("DOMContentLoaded", () => {
    // Simular tiempo de carga (Loading de 2.5 segundos)
    setTimeout(() => {
        document.getElementById("screen-loading").classList.remove("active");
        
        // Verificamos si entra por primera vez (usando localStorage)
        if (!localStorage.getItem("kronos_initialized")) {
            document.getElementById("screen-welcome").classList.add("active");
        } else {
            document.getElementById("screen-home").classList.add("active");
        }
    }, 2500);

    // Eventos de la pantalla de Bienvenida
    document.getElementById("btn-skip").addEventListener("click", () => {
        localStorage.setItem("kronos_initialized", "true");
        document.getElementById("screen-welcome").classList.remove("active");
        document.getElementById("screen-home").classList.add("active");
    });

    // Cargar y Parsear las novedades desde update.txt
    fetchUpdates();
});

// Función para abrir secciones (Redirecciones o cambios de vista futuros)
function openSection(section) {
    console.log(`Abriendo sección: ${section}`);
    // Aquí puedes manejar la lógica para mostrar tus pantallas de Calendario, Tareas o Notas
}

// PARSER DE TEXTO PERSONALIZADO PARA UPDATE.TXT
async function fetchUpdates() {
    try {
        const response = await fetch('update.txt');
        if (!response.ok) throw new Error('No se pudo cargar update.txt');
        const text = await response.text();
        
        const container = document.getElementById("updates-content");
        container.innerHTML = parseKronosFormat(text);
    } catch (error) {
        console.error(error);
        document.getElementById("updates-content").innerHTML = "<p>No se pudieron cargar las novedades.</p>";
    }
}

function parseKronosFormat(rawText) {
    // Dividir por líneas
    const lines = rawText.split('\n');
    let htmlOutput = "";

    lines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed) return;

        // Detectar etiquetas principales H1>, H2>, H3> sacando el cierre "<"
        let tag = "";
        let content = "";

        if (trimmed.startsWith("H1>")) {
            tag = "h1";
            content = trimmed.replace("H1>", "").replace(/<$/, "");
        } else if (trimmed.startsWith("H2>")) {
            tag = "h2";
            content = trimmed.replace("H2>", "").replace(/<$/, "");
        } else if (trimmed.startsWith("H3>")) {
            tag = "p"; // Estilizamos el H3 como párrafo cómodo según el diseño de UI
            content = trimmed.replace("H3>", "").replace(/<$/, "");
        } else {
            // Si no tiene etiqueta definida por defecto es un párrafo
            tag = "p";
            content = trimmed;
        }

        // Reemplazar decoradores de formato interno de forma cruzada y segura:
        // Soporta tanto *Texto* como _Texto_ para Negritas y Cursivas dinámicamente
        content = content
            .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // Convierte *texto* en Negrita
            .replace(/_(.*?)_/g, "<em>$1</em>");         // Convierte _texto_ en Cursiva

        htmlOutput += `<${tag}>${content}</${tag}>`;
    });

    return htmlOutput;
}