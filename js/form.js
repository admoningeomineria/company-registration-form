const form = document.getElementById("formRCD");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const spinner = document.getElementById("spinner");
const resetFormBtn = document.getElementById("resetFormBtn");

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbzE8HN1jW4saEkLkc1lSvpOeHWMOGmxuggfwF39Vwi4xcHIItJCK7SnxHMH0rpEmE9I/exec";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validar último paso antes de enviar
  const lastStep = document.querySelector('.step[data-step="2"]');
  if (!validateStep(lastStep)) return;

  try {
    const formData = new FormData(form);

    // Preparar UI
    loader.classList.remove("hidden");
    spinner.classList.remove("hidden");
    resetFormBtn.classList.add("hidden");
    loaderText.textContent = "Enviando información...";
    loaderText.style.color = "black";

    // Procesar archivos
    const rutEmpresasFile = formData.get("rut_empresa");
    const camaraComercioEmpresa = formData.get("camara_comercio_empresa");
    const rutEmpresaBase64 = await fileToBase64(rutEmpresasFile);
    const camaraComercioBase64 = await fileToBase64(camaraComercioEmpresa);

    // Construir Objeto
    const data = {
      correo_formulario: formData.get("correo_formulario"),
      autorizacion_datos: !!formData.get("autorizacion_datos"),

      nit_empresa: formData.get("nit_empresa"),
      razon_social_empresa: formData.get("razon_social_empresa"),
      sigla_empresa: formData.get("sigla_empresa"),
      correo_empresa: formData.get("correo_empresa"),
      rut_empresa: {
        nombre: rutEmpresasFile.name,
        mimeType: rutEmpresasFile.type,
        base64: rutEmpresaBase64,
      },
      camara_comercio_empresa: {
        nombre: camaraComercioEmpresa.name,
        mimeType: camaraComercioEmpresa.type,
        base64: camaraComercioBase64,
      },

      nombre_area_contable: formData.get("nombre_area_contable"),
      telefono_area_contable: formData.get("telefono_area_contable"),
      correo_facturacion: formData.get("correo_facturacion"),

      nombre_area_comercial: formData.get("nombre_area_comercial"),
      telefono_area_comercial: formData.get("telefono_area_comercial"),
      correo_contacto_area_comercial: formData.get("correo_contacto_area_comercial"),

      rete_fuente: formData.get("rete_fuente"),
      rete_ica: formData.get("rete_ica"),
      practica_retenciones: formData.get("practica_retenciones"),
      observaciones: formData.get("observaciones"),
    };

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (res.success) {
      spinner.classList.add("hidden");
      loaderText.textContent = "✅ ¡Solicitud enviada con éxito!";
      loaderText.style.color = "green";
      resetFormBtn.classList.remove("hidden");
      form.reset(); // Limpiar formulario detrás
    } else {
      throw new Error("El servidor respondió con un error.");
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
  // Reiniciar a paso 1
  currentStep = 0;
  showStep(0);
  form.reset();
  // Limpiar errores visuales
  document
    .querySelectorAll(".input-error")
    .forEach((el) => el.classList.remove("input-error"));
  document
    .querySelectorAll(".error-msg.active")
    .forEach((el) => el.classList.remove("active"));
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
