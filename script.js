class Competitor {
    constructor(name, votes, type, partiesCount = 0) {
        this.name = name;
        this.votes = votes;
        this.type = type;
        this.partiesCount = partiesCount;
        this.mandates = 0;
        this.unusedVotes = 0;
    }
}

const competitors = [];
let totalMandates = 0;

document.getElementById('competitor-type').addEventListener('change', function() {
    const type = this.value;
    const partiesCountGroup = document.getElementById('parties-count-group');
    if (type === 'alianta') {
        partiesCountGroup.style.display = 'block';
    } else {
        partiesCountGroup.style.display = 'none';
    }
});

function setTotalMandates() {
    totalMandates = parseInt(document.getElementById('numar-mandate').value);
    if (totalMandates > 0) {
        document.getElementById('mandates-cell').textContent = totalMandates;
        document.getElementById('mandates-table').style.display = 'table';
        document.getElementById('mandate-group').style.display = 'none';
    } else {
        alert('Te rog introdu un număr valid de mandate.');
    }
}

function addCompetitor() {
    const name = document.getElementById('competitor-name').value;
    const votes = parseInt(document.getElementById('competitor-votes').value);
    const type = document.getElementById('competitor-type').value;
    let partiesCount = 0;
    if (type === 'alianta') {
        partiesCount = parseInt(document.getElementById('parties-count').value);
    }

    if (name && votes >= 0 && type) {
        const competitor = new Competitor(name, votes, type, partiesCount);
        competitors.push(competitor);
        addCompetitorToTable(competitor);
        clearCompetitorForm();
        alert('Competitor adăugat!');
    } else {
        alert('Te rog completează toate câmpurile.');
    }
}

function addCompetitorToTable(competitor) {
    const table = document.getElementById('competitors-table');
    const tbody = table.querySelector('tbody');
    const row = tbody.insertRow();
    row.insertCell(0).textContent = competitor.name;
    row.insertCell(1).textContent = competitor.votes;

    if (table.style.display === 'none') {
        table.style.display = 'table';
    }
}

function clearCompetitorForm() {
    document.getElementById('competitor-name').value = '';
    document.getElementById('competitor-votes').value = '';
    document.getElementById('competitor-type').value = 'partid';
    document.getElementById('parties-count-group').style.display = 'none';
    document.getElementById('parties-count').value = '';
}

function finalizeCompetitors() {
    if (totalMandates > 0 && competitors.length > 0) {
        const results = calculateMandates(totalMandates, competitors);
        displayResults(results);
    } else {
        alert('Te rog introdu numărul de mandate și cel puțin un competitor.');
    }
}

function calculateMandates(totalMandates, competitors) {
    let validCompetitors = [];
    let totalValidVotes = 0;
    let thresholds = [];
    let passedCompetitors = [];
    let totalPartyVotes = 0;

    // Calculate total number of votes
    const totalVotes = competitors.reduce((sum, c) => sum + c.votes, 0);

    // Calculate electoral thresholds and filter valid competitors
    for (let competitor of competitors) {
        let threshold = 0;
        if (competitor.type === 'partid') {
            threshold = Math.floor(0.05 * totalVotes);
        } else if (competitor.type === 'alianta') {
            if (competitor.partiesCount === 2) {
                threshold = Math.floor(0.07 * totalVotes);
            } else if (competitor.partiesCount >= 3) {
                threshold = Math.floor(0.08 * totalVotes);
            }
        } else if (competitor.type === 'independent') {
            threshold = Math.floor(0.05 * totalVotes);
        }

        thresholds.push({
            name: competitor.name,
            type: competitor.type,
            threshold: threshold,
            votes: competitor.votes
        });

        if (competitor.votes >= threshold) {
            validCompetitors.push(competitor);
            totalValidVotes += competitor.votes;
            passedCompetitors.push(competitor);
        }
    }

    // Calculate electoral coefficient
    const electoralCoefficient = Math.floor(totalValidVotes / totalMandates);

    // First phase allocation
    let remainingMandates = totalMandates;
    for (let competitor of validCompetitors) {
        competitor.mandates = Math.floor(competitor.votes / electoralCoefficient);
        competitor.unusedVotes = competitor.votes % electoralCoefficient;
        remainingMandates -= competitor.mandates;
    }

    // Second phase allocation
    while (remainingMandates > 0) {
        validCompetitors.sort((a, b) => b.unusedVotes - a.unusedVotes);
        if (validCompetitors[0].unusedVotes === 0) break;
        
        validCompetitors[0].mandates++;
        validCompetitors[0].unusedVotes = 0;
        remainingMandates--;
    }

    return {
        validCompetitors: validCompetitors,
        thresholds: thresholds,
        electoralCoefficient: electoralCoefficient,
        passedCompetitors: passedCompetitors
    };
}

function displayResults(results) {
    const { validCompetitors, thresholds, electoralCoefficient, passedCompetitors } = results;

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<h2>Rezultate</h2>';
    resultDiv.innerHTML += `<p>Coeficient Electoral: ${electoralCoefficient}</p>`;
    
    resultDiv.innerHTML += '<h3>Praguri Electorale</h3>';
    thresholds.forEach(threshold => {
        resultDiv.innerHTML += `<p>${threshold.name} (${threshold.type}) - Prag: ${threshold.threshold.toLocaleString('ro-RO')}, Voturi: ${threshold.votes}</p>`;
    });

    resultDiv.innerHTML += '<h3>Competitori care au trecut pragul electoral</h3>';
    passedCompetitors.forEach(competitor => {
        if (competitor.type !== 'independent') {
            resultDiv.innerHTML += `<p>${competitor.name} - Voturi: ${competitor.votes}</p>`;
        } else {
            resultDiv.innerHTML += `<p>${competitor.name} - Voturi prag electoral: ${competitor.votes}</p>`;
        }
    });

    resultDiv.innerHTML += '<h3>Mandate Obținute</h3>';
    validCompetitors.forEach(competitor => {
        resultDiv.innerHTML += `<p>${competitor.name} - Mandate: ${competitor.mandates}</p>`;
    });
}
