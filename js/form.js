const form = document.getElementById("formRCD");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const spinner = document.getElementById("spinner");
const resetFormBtn = document.getElementById("resetFormBtn");

// URL de tu segundo script (el que acabamos de ajustar)
const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbza-bMRusfaxMW5dLN7Vy-WJiOOuic6dR_3_LL94sRaCSCGhg8Q1Eqb6xx9pWc9Gb_v/exec";

// --- FUNCIÓN PARA SUBIDA RESUMIBLE (IGUAL QUE FORM 1) ---
async function uploadFileResumable(file, folderId, accessToken) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  // 1. Iniciar sesión de subida
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type,
        "X-Upload-Content-Length": file.size,
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) throw new Error("No se pudo iniciar la subida a Drive");

  const location = response.headers.get("Location");

  // 2. Subir el archivo binario
  const uploadResponse = await fetch(location, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) throw new Error("Fallo al subir el archivo");

  const result = await uploadResponse.json();
  return `https://drive.google.com/file/d/${result.id}/view`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validar último paso (En este form es el paso 2)
  const lastStep = document.querySelector('.step[data-step="2"]');
  if (!validateStep(lastStep)) return;

  try {
    // Preparar UI
    loader.classList.remove("hidden");
    spinner.classList.remove("hidden");
    resetFormBtn.classList.add("hidden");
    loaderText.textContent = "Obteniendo autorización...";
    loaderText.style.color = "black";

    // 1. Obtener Token de Acceso desde el Backend (doGet)
    const authRes = await fetch(`${BACKEND_URL}?action=getToken`);
    const authData = await authRes.json();
    const { token, folderId } = authData;

    const formData = new FormData(form);
    const rutFile = formData.get("rut_empresa");
    const camaraFile = formData.get("camara_comercio_empresa");

    let rutUrl = "";
    let camaraUrl = "";

    // 2. Subir Archivos Directamente a Drive
    if (rutFile && rutFile.size > 0) {
      loaderText.textContent = "Subiendo RUT de la empresa...";
      rutUrl = await uploadFileResumable(rutFile, folderId, token);
    }

    if (camaraFile && camaraFile.size > 0) {
      loaderText.textContent = "Subiendo Cámara de Comercio...";
      camaraUrl = await uploadFileResumable(camaraFile, folderId, token);
    }

    // 3. Construir Objeto final (Solo texto y links de Drive)
    loaderText.textContent = "Registrando empresa en el sistema...";
    const data = {
      correo_formulario: formData.get("correo_formulario"),
      autorizacion_datos: !!formData.get("autorizacion_datos"),

      nit_empresa: formData.get("nit_empresa"),
      razon_social_empresa: formData.get("razon_social_empresa"),
      sigla_empresa: formData.get("sigla_empresa"),
      correo_empresa: formData.get("correo_empresa"),
      
      // Enviamos URLs y nombres para que el backend los use en el mail
      rut_empresa_url: rutUrl,
      rut_empresa_nombre: rutFile ? rutFile.name : "N/A",
      camara_comercio_url: camaraUrl,
      camara_comercio_nombre: camaraFile ? camaraFile.name : "N/A",

      nombre_area_contable: formData.get("nombre_area_contable"),
      telefono_area_contable: formData.get("telefono_area_contable"),
      correo_facturacion: formData.get("correo_facturacion"),

      nombre_area_comercial: formData.get("nombre_area_comercial"),
      telefono_area_comercial: formData.get("telefono_area_comercial"),
      correo_contacto_area_comercial: formData.get("correo_contacto_area_comercial"),

      rete_fuente: formData.get("rete_fuente") || "No",
      rete_ica: formData.get("rete_ica") || "No",
      practica_retenciones: formData.get("practica_retenciones") || "No",
      observaciones: formData.get("observaciones"),
    };

    // 4. Enviar datos al doPost
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (res.success) {
      spinner.classList.add("hidden");
      loaderText.textContent = "✅ ¡Registro completado con éxito!";
      loaderText.style.color = "green";
      resetFormBtn.classList.remove("hidden");
      form.reset();
    } else {
      throw new Error(res.message || "Error en el servidor");
    }
  } catch (err) {
    spinner.classList.add("hidden");
    loaderText.textContent = "❌ Error: " + err.message;
    loaderText.style.color = "red";
    resetFormBtn.classList.remove("hidden");
  }
});

resetFormBtn.addEventListener("click", () => {
  loader.classList.add("hidden");
  currentStep = 0;
  showStep(0);
  form.reset();
  document.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  document.querySelectorAll(".error-msg.active").forEach((el) => el.classList.remove("active"));
});
