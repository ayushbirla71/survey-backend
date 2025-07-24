import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

class FileService {
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowNumber++;
          try {
            // Validate required fields
            if (!data.firstName || !data.lastName || !data.email) {
              errors.push(`Row ${rowNumber}: Missing required fields (firstName, lastName, email)`);
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
              errors.push(`Row ${rowNumber}: Invalid email format`);
              return;
            }

            results.push({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone || '',
              ageGroup: data.ageGroup || '',
              gender: data.gender || '',
              city: data.city || '',
              state: data.state || '',
              country: data.country || '',
              industry: data.industry || '',
              jobTitle: data.jobTitle || '',
              education: data.education || '',
              income: data.income || ''
            });
          } catch (error) {
            errors.push(`Row ${rowNumber}: ${error.message}`);
          }
        })
        .on('end', () => {
          resolve({ data: results, errors });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const results = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 1;
        
        try {
          // Validate required fields
          if (!row.firstName || !row.lastName || !row.email) {
            errors.push(`Row ${rowNumber}: Missing required fields (firstName, lastName, email)`);
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            errors.push(`Row ${rowNumber}: Invalid email format`);
            return;
          }

          results.push({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || '',
            ageGroup: row.ageGroup || '',
            gender: row.gender || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            industry: row.industry || '',
            jobTitle: row.jobTitle || '',
            education: row.education || '',
            income: row.income || ''
          });
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      });

      return { data: results, errors };
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  generateCSV(data, headers) {
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  generateExcel(data, sheetName = 'Data') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  generatePDF(surveyResults) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Survey Results Report', 20, 30);
    
    // Survey info
    doc.setFontSize(12);
    doc.text(`Survey: ${surveyResults.survey.title}`, 20, 50);
    doc.text(`Category: ${surveyResults.survey.category}`, 20, 60);
    doc.text(`Total Responses: ${surveyResults.stats.totalResponses}`, 20, 70);
    doc.text(`Completion Rate: ${surveyResults.stats.completionRate}%`, 20, 80);

    let yPosition = 100;

    // Question results
    surveyResults.questionResults.forEach((question, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(14);
      doc.text(`Q${index + 1}: ${question.question}`, 20, yPosition);
      yPosition += 15;

      if (question.type === 'multiple_choice' && question.data) {
        const tableData = question.data.map(item => [
          item.option,
          item.count.toString(),
          `${item.percentage}%`
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Option', 'Count', 'Percentage']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 }
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }
    });

    return doc.output('arraybuffer');
  }

  async cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

export default new FileService();
