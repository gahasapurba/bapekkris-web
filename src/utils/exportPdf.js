import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportPresentationToPdf(elementId, filename = null, activeTenure = null) {
  const finalFilename = filename || (activeTenure?.code ? `Bagan_Organisasi_Bapekkris_Bank_Mandiri_${activeTenure.code}.pdf` : 'Bagan_Organisasi_Bapekkris_Bank_Mandiri.pdf');
  const targetElement = document.getElementById(elementId);
  
  if (!targetElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Ensure element is visible in viewport coordinate space
  targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });

  // Adapt background to active theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = isDark ? '#070d1e' : '#f8fafc';

  try {
    const canvas = await html2canvas(targetElement, {
      scale: 2, // High resolution crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        clonedDoc.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

        if (isDark) {
          clonedDoc.documentElement.style.backgroundColor = '#070d1e';
          clonedElement.style.backgroundColor = '#070d1e';
          clonedElement.querySelectorAll('.glass-panel, .crew-member-card, .org-anggota-box').forEach(el => {
            el.style.backgroundColor = '#0e1937';
            el.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          });
          clonedElement.querySelectorAll('h1, h2, h3, h4').forEach(el => {
            el.style.color = '#f8fafc';
          });
        } else {
          clonedDoc.documentElement.style.backgroundColor = '#f8fafc';
          clonedElement.style.backgroundColor = '#f8fafc';
          clonedElement.querySelectorAll('.glass-panel, .crew-member-card, .org-anggota-box').forEach(el => {
            el.style.backgroundColor = '#ffffff';
            el.style.borderColor = '#e2e8f0';
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(finalFilename);
  } catch (error) {
    console.error('PDF Export Error:', error);
    window.print();
  }
}
