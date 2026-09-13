import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportDashboardPdf(elementId, title = "Competitive Intelligence Report") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Nothing to export");
  const canvas = await html2canvas(el, {
    backgroundColor: "#0A0D14",
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  pdf.setFillColor(10, 13, 20);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setTextColor(248, 250, 252);
  pdf.setFontSize(16);
  pdf.text(title, margin, 34);
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(new Date().toLocaleString(), margin, 48);

  let heightLeft = imgH;
  let position = 60;
  pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
  heightLeft -= pageH - position;
  while (heightLeft > 0) {
    pdf.addPage();
    pdf.setFillColor(10, 13, 20);
    pdf.rect(0, 0, pageW, pageH, "F");
    position = heightLeft - imgH + margin;
    pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save("competitive-intelligence-report.pdf");
}
