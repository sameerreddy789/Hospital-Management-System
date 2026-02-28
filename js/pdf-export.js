// PDF export module
// Uses jsPDF (loaded via CDN) for prescription PDF generation
// Attached to window object for cross-file access

/**
 * Generates and downloads a prescription PDF.
 * @param {Object} prescription - Prescription data
 */
function generatePrescriptionPDF(prescription) {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    alert('PDF generation is unavailable. Please try again later.');
    return;
  }

  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  var y = 20;

  // Header
  doc.setFontSize(20);
  doc.text('TumourCare - Oncology Centre', 105, y, { align: 'center' });
  y += 10;
  doc.setFontSize(14);
  doc.text('Prescription', 105, y, { align: 'center' });
  y += 15;

  // Date
  doc.setFontSize(10);
  var dateStr = prescription.createdAt
    ? new Date(prescription.createdAt.seconds * 1000).toLocaleDateString()
    : new Date().toLocaleDateString();
  doc.text('Date: ' + dateStr, 15, y);
  y += 10;

  // Doctor and Patient
  doc.setFontSize(12);
  doc.text('Doctor: ' + (prescription.doctorName || ''), 15, y);
  y += 8;
  doc.text('Patient: ' + (prescription.patientName || ''), 15, y);
  y += 15;

  // Medicines table header
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Medicine', 15, y);
  doc.text('Dosage', 80, y);
  doc.text('Frequency', 130, y);
  y += 2;
  doc.line(15, y, 195, y);
  y += 6;

  // Medicines rows
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  (prescription.medicines || []).forEach(function(med) {
    doc.text(med.name || '', 15, y);
    doc.text(med.dosage || '', 80, y);
    doc.text(med.frequency || '', 130, y);
    y += 8;
  });

  // Notes
  if (prescription.notes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 15, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    var lines = doc.splitTextToSize(prescription.notes, 170);
    doc.text(lines, 15, y);
  }

  doc.save('prescription-' + (prescription.id || 'download') + '.pdf');
}

/**
 * Opens browser print dialog for a prescription.
 * @param {Object} prescription - Prescription data
 */
function printPrescription(prescription) {
  window.print();
}

// Export to window
window.generatePrescriptionPDF = generatePrescriptionPDF;
window.printPrescription = printPrescription;
