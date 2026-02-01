import Chart from "chart.js/auto";

export function renderGraph(data) {
    const context = document.getElementById('graphCanvas').getContext('2d');
    const chart = new Chart(context, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Task Statistics',
                    data: data.values,
                    backgroundColor: ['rgba(99, 102, 241, 0.7)', 'rgba(234, 88, 12, 0.7)', 'rgba(16, 185, 129, 0.7)'],
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
        }
    });

    return chart;
}