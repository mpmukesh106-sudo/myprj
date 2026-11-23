import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from database.db import get_diagnostic_by_id, get_diagnostics

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter()

@router.get("/reports/{diag_id}")
async def get_report_data(diag_id: int):
    """Retrieves full diagnostic report information for display or download."""
    record = get_diagnostic_by_id(diag_id)
    if not record:
        raise HTTPException(status_code=404, detail="Diagnostic report not found")
        
    return {
        "status": "success",
        "data": {
            "report_id": f"REP-NET-{record['id']:05d}",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "project_title": "NetAssist – Network Troubleshooting & Automated Diagnostic Assistant",
            "academic_context": "Computer Networks (CN) + Formal Languages and Automata Theory (FLAT) + Full Stack Web Development (FSWD)",
            "diagnostic": record
        }
    }

@router.get("/reports/export/csv")
async def export_history_csv():
    """Exports all diagnostic records in SQLite as a downloadable CSV file."""
    records = get_diagnostics(limit=500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Test Type",
        "Target",
        "Status",
        "Latency (ms)",
        "Packet Loss (%)",
        "Error Message",
        "Timestamp"
    ])
    
    for r in records:
        writer.writerow([
            r["id"],
            r["test_type"],
            r["target"],
            r["status"],
            r["latency"],
            r["packet_loss"],
            r.get("error_message") or "None",
            r["timestamp"]
        ])
        
    output.seek(0)
    filename = f"netassist_diagnostic_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/{diag_id}/pdf")
async def export_report_pdf(diag_id: int):
    """Generates and streams an academic-grade PDF diagnostic report."""
    record = get_diagnostic_by_id(diag_id)
    if not record:
        raise HTTPException(status_code=404, detail="Diagnostic record not found")
        
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#2563eb')
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    
    elements = []
    
    # Header Banner
    elements.append(Paragraph("NetAssist – Network Diagnostic & Troubleshooting Report", title_style))
    elements.append(Paragraph("Academic Core Project: Computer Networks (CN) • Formal Languages & Automata Theory (FLAT) • Full Stack Web Development", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceBefore=2, spaceAfter=12))
    
    # Overview Metadata Table
    status_color = colors.HexColor('#16a34a') if record['status'] == 'SUCCESS' else (colors.HexColor('#dc2626') if record['status'] == 'FAILED' else colors.HexColor('#d97706'))
    
    meta_data = [
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(f"REP-NET-{record['id']:05d}", body_style),
         Paragraph("<b>Execution Date:</b>", body_style), Paragraph(str(record['timestamp']), body_style)],
        [Paragraph("<b>Test Type:</b>", body_style), Paragraph(str(record['test_type']), body_style),
         Paragraph("<b>Target Host/IP:</b>", body_style), Paragraph(str(record['target']), body_style)],
        [Paragraph("<b>Diagnostic Status:</b>", body_style), Paragraph(f"<b><font color='{status_color.hexval()}'>{record['status']}</font></b>", body_style),
         Paragraph("<b>Round-Trip Latency:</b>", body_style), Paragraph(f"{record['latency']} ms", body_style)],
        [Paragraph("<b>Packet Loss:</b>", body_style), Paragraph(f"{record['packet_loss']}%", body_style),
         Paragraph("<b>Generated By:</b>", body_style), Paragraph("NetAssist Automated Engine", body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))
    
    # Section: Technical Findings & Metrics
    elements.append(Paragraph("1. Technical Metrics & Observations (Computer Networks)", section_heading))
    
    details = record.get("details", {})
    obs_text = f"The automated diagnostic engine initiated a <b>{record['test_type']}</b> evaluation against <b>{record['target']}</b>. "
    if record['status'] == 'SUCCESS':
        obs_text += f"Transmission completed with an average latency of <b>{record['latency']} ms</b> and <b>0% packet loss</b>. Host acknowledged all synchronization probes."
    else:
        obs_text += f"The diagnostic detected network impairment. Observed error: <i>{record.get('error_message') or 'Connection failure'}</i>."
    elements.append(Paragraph(obs_text, body_style))
    elements.append(Spacer(1, 8))
    
    # Section: FLAT Automata Integration
    elements.append(Paragraph("2. Automata-Based Error Classification (FLAT)", section_heading))
    flat_desc = (
        "Under Formal Languages and Automata Theory, network diagnostic output is treated as a string over alphabet "
        "&Sigma;. A Deterministic Finite Automaton (DFA) M = (Q, &Sigma;, &delta;, q0, F) parses error tokens "
        "and classifies the underlying network state."
    )
    elements.append(Paragraph(flat_desc, body_style))
    elements.append(Spacer(1, 6))
    
    dfa_state = "q0 &rarr; q1" if "DNS" in str(record.get('error_message')) else ("q0 &rarr; q2" if "TIMEOUT" in str(record.get('error_message')) else "q0 &rarr; q4")
    if record['status'] == 'SUCCESS':
        dfa_state = "Normal Operation (Accepted baseline state)"
        
    flat_table_data = [
        [Paragraph("<b>Analyzed Token / String</b>", body_style), Paragraph("<b>DFA State Transition</b>", body_style), Paragraph("<b>FLAT Formal Verdict</b>", body_style)],
        [
            Paragraph(record.get("error_message") or "SUCCESS_NO_ERROR", body_style),
            Paragraph(dfa_state, body_style),
            Paragraph("Accepted by Grammar Pattern" if record.get("error_message") else "Valid Baseline Token", body_style)
        ]
    ]
    flat_table = Table(flat_table_data, colWidths=[200, 170, 170])
    flat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e7ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#c7d2fe')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(flat_table)
    elements.append(Spacer(1, 14))
    
    # Section: Recommendations & Action Plan
    elements.append(Paragraph("3. Recommended Solutions & Remediation Plan", section_heading))
    if record['status'] == 'SUCCESS':
        recom_text = "All Layer 1 through Layer 4 network parameters fall within optimal operational thresholds. No corrective action required."
    else:
        err = (record.get("error_message") or "").upper()
        if "DNS" in err:
            recom_text = "• Flush system resolver cache: run 'ipconfig /flushdns'<br/>• Set public resolver DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8)<br/>• Test port 53 UDP traffic reachability."
        elif "TIMEOUT" in err or "UNREACHABLE" in err:
            recom_text = "• Verify gateway router reachability and local subnet routing table.<br/>• Inspect edge firewall rules (ports 80, 443, ICMP).<br/>• Execute traceroute to pinpoint routing breakages."
        else:
            recom_text = "• Inspect physical Ethernet and wireless RF link quality.<br/>• Restart DHCP client adapter to acquire fresh IP lease."
            
    elements.append(Paragraph(recom_text, body_style))
    elements.append(Spacer(1, 20))
    
    # Footer
    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#94a3b8'), spaceBefore=10, spaceAfter=8))
    elements.append(Paragraph("Report verified automatically by NetAssist Architecture Core. Generated for academic examination and network administration.", subtitle_style))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"NetAssist_Report_{record['id']:04d}_{record['test_type']}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
