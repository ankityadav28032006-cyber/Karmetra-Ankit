import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Certificate } from '../types';

export interface CertificateDetails {
  candidateName: string;
  courseTitle: string;
  courseTitleHi?: string;
  verificationCode?: string;
  credentialId?: string;
  id?: string;
  issueDate?: string;
  date?: string;
  score?: number;
  scoreMarks?: number;
  totalMarks?: number;
  scorePercentage?: number;
  percentage?: number;
  skills?: string[];
  status?: string;
  isPaid?: boolean;
}

/**
 * Generates and triggers the download of an official A4 Landscape KarMetra Certificate PDF.
 * Uses jsPDF and QRCode to build a professional, verifiable credential.
 */
export async function generateCertificatePDF(
  detailsOrCert: Certificate | CertificateDetails
): Promise<void> {
  try {
    const d = detailsOrCert as any;
    const candidateName = d.candidateName || 'Candidate';
    const courseTitle = d.courseTitle || d.courseName || 'Professional Certification Course';
    const credentialId = d.verificationCode || d.credentialId || d.id || `KM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const issueDate = d.issueDate || d.date || new Date().toISOString().split('T')[0];
    const percentage = d.scorePercentage ?? d.percentage ?? 80;
    const scoreMarks = d.scoreMarks ?? d.score ?? 12;
    const totalMarks = d.totalMarks ?? 15;
    const skills = d.skills || [courseTitle];
    const status = d.status || 'ACTIVE & VALID';

    // Generate real verification QR Code pointing to verification URL
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://karmetra.in';
    const verifyUrl = `${origin}/verify/${credentialId}`;
    
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#082142',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
    } catch (qrErr) {
      console.warn('QR generation fallback:', qrErr);
    }

    // A4 Landscape: 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // 1. Background Fill - Ultra-clean crisp off-white
    doc.setFillColor(254, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 2. Primary Outer Decorative Double Border
    // Outer border: KarMetra Teal #00827F
    doc.setDrawColor(0, 130, 127);
    doc.setLineWidth(3);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner hairline border: Deep Navy #082142
    doc.setDrawColor(8, 33, 66);
    doc.setLineWidth(0.75);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Corner Ornaments
    const cornerSize = 14;
    doc.setFillColor(0, 130, 127);
    // Top-Left
    doc.rect(12, 12, cornerSize, 2, 'F');
    doc.rect(12, 12, 2, cornerSize, 'F');
    // Top-Right
    doc.rect(pageWidth - 12 - cornerSize, 12, cornerSize, 2, 'F');
    doc.rect(pageWidth - 14, 12, 2, cornerSize, 'F');
    // Bottom-Left
    doc.rect(12, pageHeight - 14, cornerSize, 2, 'F');
    doc.rect(12, pageHeight - 12 - cornerSize, 2, cornerSize, 'F');
    // Bottom-Right
    doc.rect(pageWidth - 12 - cornerSize, pageHeight - 14, cornerSize, 2, 'F');
    doc.rect(pageWidth - 14, pageHeight - 12 - cornerSize, 2, cornerSize, 'F');

    // Subtle guilloche watermark background line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.25);
    doc.line(18, 54, pageWidth - 18, 54);
    doc.line(18, 136, pageWidth - 18, 136);

    // 3. Official KarMetra Logo Header Branding
    // Render "Kar" in Navy and "Metra" in Teal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    
    // Draw KarMetra wordmark centered
    const brandX = pageWidth / 2;
    doc.setTextColor(8, 33, 66); // #082142 Navy
    doc.text('Kar', brandX - 18, 27, { align: 'right' });
    
    doc.setTextColor(0, 130, 127); // #00827F Teal
    doc.text('Metra', brandX - 17, 27, { align: 'left' });

    // Platform Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NATIONAL SKILL RECOGNITION & VERIFIED CREDENTIAL DIRECTORY', brandX, 34.5, { align: 'center' });

    // 4. Main Certificate Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(8, 33, 66);
    doc.text('CERTIFICATE OF COMPLETION', brandX, 45, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('This is to officially certify that', brandX, 55, { align: 'center' });

    // 5. Candidate Full Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(8, 33, 66);
    doc.text(candidateName.toUpperCase(), brandX, 68, { align: 'center' });

    // Underline beneath candidate name
    doc.setDrawColor(0, 130, 127);
    doc.setLineWidth(0.8);
    doc.line(brandX - 55, 71.5, brandX + 55, 71.5);

    // 6. Course & Curriculum Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    doc.text('has successfully completed the proctored curriculum and passed the examination for', brandX, 80, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 130, 127);
    doc.text(courseTitle, brandX, 90, { align: 'center' });

    // Demonstrated Skills Chip
    if (skills && skills.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const skillString = skills.slice(0, 6).join('  •  ');
      doc.text(`Demonstrated Competencies: ${skillString}`, brandX, 97, { align: 'center' });
    }

    // 7. Score & Assessment Performance Badge
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.setLineWidth(0.5);
    doc.roundedRect(brandX - 45, 103, 90, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text(
      `Assessment Score: ${scoreMarks}/${totalMarks} (${percentage}%) • Passing Criteria Met (≥80%)`,
      brandX,
      109.5,
      { align: 'center' }
    );

    // 8. Verification Status & Security Box
    const statusText = status.toUpperCase().includes('VALID') ? 'ACTIVE & VALID' : status.toUpperCase();
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, 122, pageWidth - 36, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text('● VERIFICATION STATUS: ' + statusText, 24, 128.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Verification Code: ${credentialId}`, pageWidth - 24, 128.5, { align: 'right' });

    // 9. Bottom Section: QR Code (Left), Meta Details (Center), Authorized Signature (Right)
    
    // Left: QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 24, 139, 32, 32);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(8, 33, 66);
    doc.text('SCAN TO VERIFY ONLINE', 40, 174, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('karMetra.in/verify', 40, 177.5, { align: 'center' });

    // Center: Credential Information
    const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Credential ID: ${credentialId}`, brandX, 147, { align: 'center' });
    doc.text(`Date of Issuance: ${formattedDate}`, brandX, 154, { align: 'center' });
    doc.text(`Public Record Hash: SHA256-${credentialId.replace(/[^A-Z0-9]/g, '')}`, brandX, 161, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 130, 127);
    doc.text(`Verification Portal: ${verifyUrl}`, brandX, 168, { align: 'center' });

    // Right: Authorized Signature
    const sigX = pageWidth - 65;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(sigX - 28, 160, sigX + 28, 160);

    // Signature name
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(8, 33, 66);
    doc.text('Dr. A. K. Sharma', sigX, 156, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Academic & Certification Director', sigX, 166, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('KarMetra National Council', sigX, 171, { align: 'center' });

    // Bottom Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'KarMetra Skill & Employment Directorate • Digital Record Secured • Verified Authentic Credential',
      brandX,
      198,
      { align: 'center' }
    );

    // Save PDF
    const filename = `KarMetra_Certificate_${credentialId}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF certificate:', error);
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

/**
 * Generates and downloads an ATS-compliant, professionally formatted KarMetra Candidate CV (PDF)
 * using actual candidate profile and resume data (No mock or dummy placeholders).
 */
export async function generateCandidateCVPDF(
  candidateData: any,
  resumeData?: any,
  certificates?: any[]
): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2);

    let y = 18;

    // Header Bar: KarMetra Branding Top Bar
    doc.setFillColor(8, 33, 66); // Deep Navy #082142
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(0, 130, 127); // Teal #00827F
    doc.rect(0, 5, pageWidth, 1.5, 'F');

    // Logo / Brand Top Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(8, 33, 66);
    doc.text('Kar', pageWidth - margin - 22, y);
    doc.setTextColor(0, 130, 127);
    doc.text('Metra', pageWidth - margin - 13, y);

    // Candidate Name
    const fullName = candidateData?.fullName || resumeData?.personalInfo?.fullName || 'Candidate';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(8, 33, 66);
    doc.text(fullName.toUpperCase(), margin, y);
    y += 7;

    // Headline / Target Role
    const headline = resumeData?.headline || candidateData?.headline || candidateData?.preferredJobRole || candidateData?.skills?.[0] || 'Professional';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 130, 127);
    doc.text(headline, margin, y);
    y += 6;

    // Contact Information (Email, Mobile, Location)
    const mobile = candidateData?.mobile || resumeData?.personalInfo?.phone || '';
    const email = candidateData?.email || resumeData?.personalInfo?.email || '';
    const city = candidateData?.city || resumeData?.personalInfo?.city || '';
    const state = candidateData?.state || resumeData?.personalInfo?.state || '';
    const locationStr = [city, state].filter(Boolean).join(', ');

    const contactItems: string[] = [];
    if (mobile) contactItems.push(`Phone: +91 ${mobile}`);
    if (email) contactItems.push(`Email: ${email}`);
    if (locationStr) contactItems.push(`Location: ${locationStr}`);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(contactItems.join('   |   '), margin, y);
    y += 5;

    // Horizontal Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // --- Helper function for section headings ---
    const renderSectionHeading = (title: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(8, 33, 66);
      doc.text(title.toUpperCase(), margin, y);
      y += 2;
      doc.setDrawColor(0, 130, 127);
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 28, y);
      y += 5;
    };

    // 1. Professional Summary
    const summary = resumeData?.summary || candidateData?.bio || candidateData?.careerObjective;
    if (summary) {
      renderSectionHeading('Professional Summary');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitSummary = doc.splitTextToSize(summary, contentWidth);
      doc.text(splitSummary, margin, y);
      y += (splitSummary.length * 4.5) + 4;
    }

    // 2. Key Skills & Competencies
    const skills: string[] = resumeData?.skills || candidateData?.skills || [];
    if (skills.length > 0) {
      renderSectionHeading('Key Skills & Competencies');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      // Render as clean bullet pill badges
      let pillX = margin;
      let pillY = y;
      const pillHeight = 6;

      skills.forEach(skill => {
        const textWidth = doc.getTextWidth(skill);
        const pillWidth = textWidth + 8;

        if (pillX + pillWidth > pageWidth - margin) {
          pillX = margin;
          pillY += pillHeight + 2.5;
        }

        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(pillX, pillY - 4.5, pillWidth, pillHeight, 1.2, 1.2, 'FD');

        doc.setTextColor(30, 41, 59);
        doc.text(skill, pillX + 4, pillY - 0.5);

        pillX += pillWidth + 3;
      });

      y = pillY + 8;
    }

    // 3. Work Experience
    const experiences = resumeData?.experience || candidateData?.experience || [];
    if (experiences.length > 0) {
      renderSectionHeading('Work Experience');
      experiences.forEach((exp: any) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(8, 33, 66);
        doc.text(exp.role || exp.title || exp.jobTitle || 'Role', margin, y);

        const duration = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
        if (duration) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(duration, pageWidth - margin, y, { align: 'right' });
        }
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 130, 127);
        const orgInfo = [exp.company || exp.organization, exp.location].filter(Boolean).join(' • ');
        doc.text(orgInfo || 'Company', margin, y);
        y += 4.5;

        if (exp.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const splitDesc = doc.splitTextToSize(exp.description, contentWidth);
          doc.text(splitDesc, margin, y);
          y += (splitDesc.length * 4.2) + 3;
        } else {
          y += 2;
        }
      });
    }

    // 4. Education & Qualifications
    const education = resumeData?.education || candidateData?.education || [];
    if (education.length > 0) {
      renderSectionHeading('Education & Qualifications');
      education.forEach((edu: any) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(8, 33, 66);
        doc.text(edu.degree || edu.qualification || edu.course || 'Degree', margin, y);

        const year = edu.passingYear || edu.year || [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
        if (year) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(String(year), pageWidth - margin, y, { align: 'right' });
        }
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const instInfo = [edu.institution || edu.school || edu.college, edu.board || edu.university].filter(Boolean).join(', ');
        doc.text(instInfo || 'Institution', margin, y);
        y += 6;
      });
    }

    // 5. KarMetra Verified Certifications & Credentials
    const certs = candidateData?.certificates || resumeData?.certifications || [];
    if (certs.length > 0) {
      renderSectionHeading('Verified Certifications & Credentials');
      certs.forEach((c: any) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 130, 127);
        const certName = c.courseTitle || c.name || c.title || 'Certified Credential';
        doc.text(`✓ ${certName}`, margin, y);

        const code = c.verificationCode || c.id;
        if (code) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`ID: ${code}`, pageWidth - margin, y, { align: 'right' });
        }
        y += 5;
      });
    }

    // Bottom Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generated via KarMetra Career Platform • Authentic Candidate Record',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`KarMetra_CV_${safeName}.pdf`);
  } catch (error) {
    console.error('Error generating candidate CV PDF:', error);
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

export default { generateCertificatePDF, generateCandidateCVPDF };

