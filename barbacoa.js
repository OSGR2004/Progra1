function calcularBarbacoa() {
    const precioPorKilo = 420;
    const dinero = parseFloat(document.getElementById("dinero").value);
    const resultadoDiv = document.getElementById("resultado");

    if (isNaN(dinero) || dinero <= 0) {
        resultadoDiv.innerHTML = "<p style='color:red;'>Por favor, ingresa una cantidad válida.</p>";
        return;
    }

    const kilos = dinero / precioPorKilo;
    const gramos = kilos * 1000;

    resultadoDiv.innerHTML = `
        <p>Puedes comprar aproximadamente:</p>
        <ul>
            <li><strong>${kilos.toFixed(2)} kilogramos</strong></li>
            <li><strong>${Math.round(gramos)} gramos</strong></li>
        </ul>
    `;
}
