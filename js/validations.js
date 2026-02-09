const today = new Date().toISOString().split("T")[0];
const dateInputs = document.querySelectorAll('input[type="date"]');
dateInputs.forEach((input) => (input.max = today));

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// Funciones de utilidad para mostrar errores en UI
function showError(input, message) {
  const formGroup = input.closest(".form-group") || input.parentElement;
  const errorSpan = formGroup.querySelector(".error-msg");
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.classList.add("active");
  }
  input.classList.add("input-error");
}

function clearError(input) {
  const formGroup = input.closest(".form-group") || input.parentElement;
  const errorSpan = formGroup.querySelector(".error-msg");
  if (errorSpan) {
    errorSpan.classList.remove("active");
    errorSpan.textContent = "";
  }
  input.classList.remove("input-error");
}

// Validación de archivos específica
function validateFile(input) {
  const file = input.files[0];
  const type = input.accept; // .xlsx o .pdf

  if (!file) {
    showError(input, "Este archivo es obligatorio");
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    showError(input, "El archivo supera el tamaño máximo permitido (500MB)");
    return false;
  }

  const fileName = file.name.toLowerCase();
  if (type.includes("pdf") && !fileName.endsWith(".pdf")) {
    showError(input, "Debe ser un archivo PDF");
    return false;
  }

  clearError(input);
  return true;
}

function validateStep(stepElement) {
  const inputs = stepElement.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );
  let isValid = true;

  inputs.forEach((input) => {
    // 1. Lógica para Radios (Ya la tenías)
    if (input.type === "radio") {
      const groupName = input.name;
      const checked = stepElement.querySelector(`input[name="${groupName}"]:checked`);
      if (!checked) {
        const groupContainer = input.closest(".form-group");
        const errorSpan = groupContainer.querySelector(".error-msg");
        if (errorSpan) {
          errorSpan.textContent = "Seleccione una opción";
          errorSpan.classList.add("active");
        }
        isValid = false;
      } else {
        const groupContainer = input.closest(".form-group");
        const errorSpan = groupContainer.querySelector(".error-msg");
        if (errorSpan) errorSpan.classList.remove("active");
      }
      return; 
    }

    // 2. Lógica para Checkbox (Autorización)
    if (input.type === "checkbox") {
      if (!input.checked) {
        showError(input, "Debe aceptar los términos para continuar");
        isValid = false;
      } else {
        clearError(input);
      }
      return;
    }

    // 3. Lógica para campos de texto/email/file
    if (!input.value.trim() && input.type !== "file") {
      showError(input, "Este campo es obligatorio");
      isValid = false;
    } else if (input.type === "email" && !/\S+@\S+\.\S+/.test(input.value)) {
      showError(input, "Ingrese un correo válido");
      isValid = false;
    } else if (input.type === "file") {
      if (!validateFile(input)) isValid = false;
    } else {
      clearError(input);
    }
  });

  return isValid;
}

// Limpiar errores mientras el usuario escribe
document.addEventListener("input", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
    if (e.target.type !== "file") clearError(e.target);
  }
});
