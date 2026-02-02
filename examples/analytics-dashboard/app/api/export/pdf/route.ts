import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    // Build where clause for metrics
    const where: any = {
      userId: session.user.id,
    }

    if (start || end) {
      where.timestamp = {}
      if (start) {
        where.timestamp.gte = new Date(start)
      }
      if (end) {
        where.timestamp.lte = new Date(end)
      }
    }

    // Fetch metrics
    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    })

    // Generate PDF
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Analytics Report', 14, 22)
    
    // Date range
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)
    if (start && end) {
      doc.text(`Period: ${start} to ${end}`, 14, 38)
    }

    // Summary section
    const totalMetrics = metrics.length
    const totalValue = metrics.reduce((sum, m) => sum + m.value, 0)
    const avgValue = totalMetrics > 0 ? totalValue / totalMetrics : 0

    doc.setFontSize(14)
    doc.text('Summary', 14, 50)
    doc.setFontSize(11)
    doc.text(`Total Records: ${totalMetrics}`, 14, 58)
    doc.text(`Total Value: ${totalValue.toFixed(2)}`, 14, 64)
    doc.text(`Average Value: ${avgValue.toFixed(2)}`, 14, 70)

    // Metrics table
    const tableData = metrics.map((m) => [
      new Date(m.timestamp).toLocaleString(),
      m.type,
      m.value.toString(),
      JSON.stringify(m.metadata).substring(0, 50) + '...',
    ])

    ;(doc as any).autoTable({
      startY: 80,
      head: [['Timestamp', 'Type', 'Value', 'Metadata']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(
        `Page ${i} of ${pageCount} - Analytics Dashboard`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }

    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
