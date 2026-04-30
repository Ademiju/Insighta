const fs = require('fs');
const path = require('path');

function exportCSV(data) {
    const file = path.join(process.cwd(), 'profiles.csv');

    const csv = [
        ['id', 'name', 'age'],
        ...data.map(d => [d.id, d.name, d.age])
    ].map(row => row.join(',')).join('\n');

    fs.writeFileSync(file, csv);

    console.log(`Saved to ${file}`);
}