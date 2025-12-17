const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'results.json');
const reportPath = path.join(__dirname, 'report.html');

function parseK6Results(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    
    const metrics = {
        http_req_duration: { values: [], avg: 0, min: 0, max: 0, p90: 0, p95: 0 },
        checkout_duration: { values: [], avg: 0, min: 0, max: 0, p90: 0, p95: 0 },
        http_reqs: 0,
        iterations: 0,
        checks: { passes: 0, fails: 0 },
        data_received: 0,
        data_sent: 0,
        vus_max: 0
    };
    
    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            
            if (data.type === 'Point' && data.metric === 'http_req_duration') {
                metrics.http_req_duration.values.push(data.data.value);
            }
            
            if (data.type === 'Point' && data.metric === 'checkout_duration') {
                metrics.checkout_duration.values.push(data.data.value);
            }
            
            if (data.type === 'Point' && data.metric === 'http_reqs') {
                metrics.http_reqs++;
            }
            
            if (data.type === 'Point' && data.metric === 'iterations') {
                metrics.iterations++;
            }
            
            if (data.type === 'Point' && data.metric === 'checks') {
                if (data.data.value === 1) {
                    metrics.checks.passes++;
                } else {
                    metrics.checks.fails++;
                }
            }
            
            if (data.type === 'Point' && data.metric === 'data_received') {
                metrics.data_received += data.data.value;
            }
            
            if (data.type === 'Point' && data.metric === 'data_sent') {
                metrics.data_sent += data.data.value;
            }
            
            if (data.type === 'Point' && data.metric === 'vus') {
                metrics.vus_max = Math.max(metrics.vus_max, data.data.value);
            }
        } catch (e) {}
    });
    
    const calcStats = (values) => {
        if (values.length === 0) return { avg: 0, min: 0, max: 0, p90: 0, p95: 0 };
        const sorted = values.sort((a, b) => a - b);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
        return { avg, min, max, p90, p95 };
    };
    
    metrics.http_req_duration = { ...metrics.http_req_duration, ...calcStats(metrics.http_req_duration.values) };
    metrics.checkout_duration = { ...metrics.checkout_duration, ...calcStats(metrics.checkout_duration.values) };
    
    return metrics;
}

function generateHTML(metrics) {
    const totalChecks = metrics.checks.passes + metrics.checks.fails;
    const checkRate = totalChecks > 0 ? ((metrics.checks.passes / totalChecks) * 100).toFixed(2) : 0;
    const p95Pass = metrics.http_req_duration.p95 < 2000;
    const checksPass = checkRate > 95;
    
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatMs = (ms) => ms.toFixed(2) + ' ms';
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório K6 - Checkout</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #7f5af0, #2cb67d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { text-align: center; color: #888; margin-bottom: 40px; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .card h3 {
            font-size: 0.9rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #7f5af0;
        }
        .card .value.success { color: #2cb67d; }
        .card .value.danger { color: #e53170; }
        .threshold-card {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .threshold-card h2 { margin-bottom: 20px; color: #7f5af0; }
        .threshold-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .threshold-item:last-child { border-bottom: none; }
        .threshold-name { font-weight: 500; }
        .threshold-status {
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85rem;
        }
        .threshold-status.pass { background: rgba(44,182,125,0.2); color: #2cb67d; }
        .threshold-status.fail { background: rgba(229,49,112,0.2); color: #e53170; }
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .metrics-table th, .metrics-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .metrics-table th {
            color: #888;
            font-weight: 500;
            font-size: 0.85rem;
            text-transform: uppercase;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Relatório de Testes K6</h1>
        <p class="subtitle">Fluxo de Checkout - Teste de Performance</p>
        
        <div class="grid">
            <div class="card">
                <h3>Total de Requisições</h3>
                <div class="value">${metrics.http_reqs}</div>
            </div>
            <div class="card">
                <h3>Iterações</h3>
                <div class="value">${metrics.iterations}</div>
            </div>
            <div class="card">
                <h3>VUs Máximo</h3>
                <div class="value">${metrics.vus_max}</div>
            </div>
            <div class="card">
                <h3>Taxa de Checks</h3>
                <div class="value ${checkRate >= 95 ? 'success' : 'danger'}">${checkRate}%</div>
            </div>
            <div class="card">
                <h3>Dados Recebidos</h3>
                <div class="value">${formatBytes(metrics.data_received)}</div>
            </div>
            <div class="card">
                <h3>Dados Enviados</h3>
                <div class="value">${formatBytes(metrics.data_sent)}</div>
            </div>
        </div>
        
        <div class="threshold-card">
            <h2>Thresholds</h2>
            <div class="threshold-item">
                <span class="threshold-name">http_req_duration p(95) < 2000ms</span>
                <span class="threshold-status ${p95Pass ? 'pass' : 'fail'}">${p95Pass ? 'PASSOU' : 'FALHOU'}</span>
            </div>
            <div class="threshold-item">
                <span class="threshold-name">checkout_duration p(95) < 2000ms</span>
                <span class="threshold-status ${metrics.checkout_duration.p95 < 2000 ? 'pass' : 'fail'}">${metrics.checkout_duration.p95 < 2000 ? 'PASSOU' : 'FALHOU'}</span>
            </div>
            <div class="threshold-item">
                <span class="threshold-name">checks rate > 95%</span>
                <span class="threshold-status ${checksPass ? 'pass' : 'fail'}">${checksPass ? 'PASSOU' : 'FALHOU'}</span>
            </div>
        </div>
        
        <div class="threshold-card">
            <h2>Métricas de Tempo de Resposta</h2>
            <table class="metrics-table">
                <thead>
                    <tr>
                        <th>Métrica</th>
                        <th>Média</th>
                        <th>Mínimo</th>
                        <th>Máximo</th>
                        <th>p(90)</th>
                        <th>p(95)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>http_req_duration</strong></td>
                        <td>${formatMs(metrics.http_req_duration.avg)}</td>
                        <td>${formatMs(metrics.http_req_duration.min)}</td>
                        <td>${formatMs(metrics.http_req_duration.max)}</td>
                        <td>${formatMs(metrics.http_req_duration.p90)}</td>
                        <td>${formatMs(metrics.http_req_duration.p95)}</td>
                    </tr>
                    <tr>
                        <td><strong>checkout_duration</strong></td>
                        <td>${formatMs(metrics.checkout_duration.avg)}</td>
                        <td>${formatMs(metrics.checkout_duration.min)}</td>
                        <td>${formatMs(metrics.checkout_duration.max)}</td>
                        <td>${formatMs(metrics.checkout_duration.p90)}</td>
                        <td>${formatMs(metrics.checkout_duration.p95)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="threshold-card">
            <h2>Checks</h2>
            <div class="grid">
                <div class="card">
                    <h3>Checks Passou</h3>
                    <div class="value success">${metrics.checks.passes}</div>
                </div>
                <div class="card">
                    <h3>Checks Falhou</h3>
                    <div class="value ${metrics.checks.fails > 0 ? 'danger' : 'success'}">${metrics.checks.fails}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>K6 Performance Testing - API Gerenciador de Tarefas</p>
        </div>
    </div>
</body>
</html>`;
}

try {
    if (!fs.existsSync(resultsPath)) {
        console.error('Arquivo results.json não encontrado!');
        console.log('Execute primeiro: k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js --out json=tests/k6/results.json');
        process.exit(1);
    }
    
    console.log('Processando resultados...');
    const metrics = parseK6Results(resultsPath);
    
    console.log('Gerando relatório HTML...');
    const html = generateHTML(metrics);
    
    fs.writeFileSync(reportPath, html);
    console.log('Relatório gerado com sucesso: ' + reportPath);
} catch (error) {
    console.error('Erro ao gerar relatório:', error.message);
    process.exit(1);
}

