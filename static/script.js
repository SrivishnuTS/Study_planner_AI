document.addEventListener('DOMContentLoaded', () => {
    // 1. Predict Form Logic
    const predictForm = document.getElementById('predict-form');
    if (predictForm) {
        predictForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                study_hours: parseFloat(document.getElementById('study_hours').value),
                break_time: parseFloat(document.getElementById('break_time').value),
                sleep_hours: parseFloat(document.getElementById('sleep_hours').value),
                focus_score: parseFloat(document.getElementById('focus_score').value),
                distraction_level: document.getElementById('distraction_level').value,
                day_of_week: document.getElementById('day_of_week').value
            };

            const resultSection = document.getElementById('result-section');
            const errorSection = document.getElementById('error-section');
            const submitBtn = predictForm.querySelector('button[type="submit"]');

            submitBtn.innerText = 'Predicting...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('prediction-text').innerText = data.predicted_pattern;
                    resultSection.classList.remove('hidden');
                    errorSection.classList.add('hidden');
                } else {
                    document.getElementById('error-text').innerText = data.error || 'Failed to generate prediction.';
                    errorSection.classList.remove('hidden');
                    resultSection.classList.add('hidden');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                document.getElementById('error-text').innerText = 'Network error occurred. Make sure the backend is running.';
                errorSection.classList.remove('hidden');
                resultSection.classList.add('hidden');
            } finally {
                submitBtn.innerText = 'Predict Study Pattern';
                submitBtn.disabled = false;
            }
        });
    }

    // 2. Fetch History Logic
    const historyTable = document.getElementById('history-table');
    if (historyTable) {
        fetch('/history')
            .then(res => res.json())
            .then(data => {
                if(data.error) {
                    console.error("History Error:", data.error);
                    return;
                }
                const tbody = historyTable.querySelector('tbody');
                data.forEach(row => {
                    const tr = document.createElement('tr');
                    const date = new Date(row.timestamp).toLocaleDateString();
                    tr.innerHTML = `
                        <td>${date}</td>
                        <td>${row.study_hours}</td>
                        <td>${row.break_time}</td>
                        <td>${row.sleep_hours}</td>
                        <td>${row.focus_score}</td>
                        <td><span style="text-transform:capitalize">${row.distraction_level}</span></td>
                        <td style="color:var(--primary-color); font-weight:600;">${row.predicted_pattern}</td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => console.error("Error fetching history:", err));
    }
});
