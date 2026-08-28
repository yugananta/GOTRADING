const fs = require('fs');
const file = 'src/components/Journal.tsx';
let content = fs.readFileSync(file, 'utf8');

// The markers in the component
const tab2Marker = "{/* TAB 2: TRADING JOURNAL */}";
const tab3Marker = "{/* TAB 3: EXECUTED METATRADER HISTORY */}";
const endMarker = "{/* POPUP 1:";

const idx2 = content.indexOf(tab2Marker);
const idx3 = content.indexOf(tab3Marker);
const endIdx = content.indexOf(endMarker);

if (idx2 !== -1 && idx3 !== -1 && endIdx !== -1) {
    let tab2Section = content.substring(idx2 + tab2Marker.length, idx3);
    let tab3Section = content.substring(idx3 + tab3Marker.length, endIdx);

    // Swap the top activeTab conditions so the swapped sections still render under the correct tab
    // Because currently tab2Section starts with `{activeTab === 'ledger' && (`
    // and tab3Section starts with `{activeTab === 'history' && (`
    tab2Section = tab2Section.replace("{activeTab === 'ledger' && (", "{activeTab === 'history' && (");
    tab3Section = tab3Section.replace("{activeTab === 'history' && (", "{activeTab === 'ledger' && (");

    // Put them back swapped:
    // tab2Marker -> tab3Section
    // tab3Marker -> tab2Section
    const newContent = content.substring(0, idx2) +
                       tab2Marker + tab3Section +
                       tab3Marker + tab2Section +
                       content.substring(endIdx);
                       
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Robusted swapped");
} else {
    console.log("Could not find markers!");
}
