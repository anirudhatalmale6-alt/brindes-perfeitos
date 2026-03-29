import jsPDF from 'jspdf';

interface QuoteItem {
  id: number;
  name: string;
  supplier_sku: string | null;
  category_name: string | null;
  quantity: number;
}

interface QuoteData {
  quoteNumber: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerWhatsApp: string;
  message: string | null;
  items: QuoteItem[];
}

export function generateQuotePDF(data: QuoteData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(90, 163, 0); // #5AA300
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Brindes Perfeitos', 20, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Brindes Promocionais Personalizados', 20, 32);

  // Contact info top right
  doc.setFontSize(9);
  doc.text('contato@brindesperfeitos.com.br', pageWidth - 20, 22, { align: 'right' });
  doc.text('WhatsApp: (11) 2771-9911', pageWidth - 20, 30, { align: 'right' });

  // Quote info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ORCAMENTO', 20, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Numero: ${data.quoteNumber}`, 20, 63);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 70);

  // Customer info box
  doc.setFillColor(249, 250, 251); // light gray
  doc.rect(20, 78, pageWidth - 40, 35, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(20, 78, pageWidth - 40, 35, 'S');

  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Dados do Cliente:', 25, 88);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nome: ${data.customerName}`, 25, 95);
  doc.text(`Empresa: ${data.customerCompany}`, 25, 101);
  doc.text(`Email: ${data.customerEmail}`, pageWidth / 2, 95);
  doc.text(`WhatsApp: ${data.customerWhatsApp}`, pageWidth / 2, 101);

  if (data.message) {
    doc.text(`Observacoes: ${data.message}`, 25, 108);
  }

  // Table header
  let y = 125;
  doc.setFillColor(90, 163, 0);
  doc.rect(20, y - 6, pageWidth - 40, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 25, y);
  doc.text('Produto', 35, y);
  doc.text('Codigo', 125, y);
  doc.text('Categoria', 150, y);
  doc.text('Qtd', pageWidth - 25, y, { align: 'right' });

  // Table rows
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  data.items.forEach((item, index) => {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Alternate row color
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
    }

    doc.setFontSize(9);
    doc.text(`${index + 1}`, 25, y);

    // Truncate long names
    const name = item.name.length > 45 ? item.name.substring(0, 42) + '...' : item.name;
    doc.text(name, 35, y);
    doc.text(item.supplier_sku || '-', 125, y);

    const cat = item.category_name
      ? (item.category_name.length > 15 ? item.category_name.substring(0, 12) + '...' : item.category_name)
      : '-';
    doc.text(cat, 150, y);
    doc.text(`${item.quantity}`, pageWidth - 25, y, { align: 'right' });

    y += 8;
  });

  // Total line
  y += 5;
  doc.setDrawColor(90, 163, 0);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total de produtos: ${data.items.length}`, 25, y);
  doc.text(`Total de itens: ${data.items.reduce((sum, i) => sum + i.quantity, 0)}`, pageWidth - 25, y, { align: 'right' });

  // Footer note
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Os precos serao informados pela nossa equipe apos analise dos produtos e quantidades solicitadas.', 20, y);
  doc.text('Este documento e um pedido de orcamento, nao um documento fiscal.', 20, y + 5);
  doc.text('Brindes Perfeitos - contato@brindesperfeitos.com.br - WhatsApp: (11) 2771-9911', 20, y + 12);

  // Convert to Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
