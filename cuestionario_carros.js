let totalScore = 0;
const answers = {
    q1: 10, // Correct answer is Porsche
    q2: 10, // Correct answer is Híbrido V12
    q3: 10, // Correct answer is Lamborghini
    q4: 10, // Correct answer is McLaren 720S
    q5: 10, // Correct answer is Bugatti
    q6: 10  // Correct answer is Porsche Taycan
};

function evaluateQuiz() {
    totalScore = 0;
    const form = document.getElementById('quizForm');
    
    // Evaluar respuestas
    for (let i = 1; i <= 6; i++) {
        const question = form[`q${i}`];
        for (let j = 0; j < question.length; j++) {
            if (question[j].checked) {
                totalScore += parseInt(question[j].value);
            }
        }
    }

    // Mostrar resultado
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>Tu puntuación es: ${totalScore}/60</h3>`;

    // Crear gráfico de barras
    createChart();
}

function createChart() {
    const ctx = document.getElementById('chartContainer');
    const data = {
        labels: ['Pregunta 1', 'Pregunta 2', 'Pregunta 3', 'Pregunta 4', 'Pregunta 5', 'Pregunta 6'],
        datasets: [{
            label: 'Puntos por Pregunta',
            data: [
                totalScore >= 10 ? answers.q1 : 0,
                totalScore >= 20 ? answers.q2 : 0,
                totalScore >= 30 ? answers.q3 : 0,
                totalScore >= 40 ? answers.q4 : 0,
                totalScore >= 50 ? answers.q5 : 0,
                totalScore >= 60 ? answers.q6 : 0
            ],
            backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F39C12', '#8E44AD', '#1ABC9C'],
            borderColor: ['#FF5733', '#33FF57', '#3357FF', '#F39C12', '#8E44AD', '#1ABC9C'],
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Diagnóstico de Marcas de Carros Deportivos', 20, 10);
    doc.text(`Tu puntuación es: ${totalScore}/60`, 20, 20);
    doc.addPage();
    doc.text('Gráfico de Resultados', 20, 10);

    // Generar imagen del gráfico y agregarla al PDF
    doc.addImage(document.getElementById('chartContainer'), 'PNG', 20, 30, 170, 80);
    
    // Descargar el PDF
    doc.save('diagnostico_carros_deportivos.pdf');
}
