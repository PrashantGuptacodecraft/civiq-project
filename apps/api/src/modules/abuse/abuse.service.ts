import { prisma, SignalType } from '@civiq/db';

export class AbuseDetectionService {
  private readonly BURST_LIMIT = 5;
  private readonly BURST_TIMEFRAME_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Main entry point to evaluate risk at submission time.
   * Does NOT auto-ban. Creates RiskSignals for human review.
   */
  async evaluateSubmissionRisk(params: {
    userId: string;
    issueId?: string;
    ipAddress?: string;
    deviceInfo?: string;
    fileHashes?: string[];
  }): Promise<{ isHighRisk: boolean; signals: string[] }> {
    const { userId, issueId, ipAddress, deviceInfo, fileHashes } = params;
    const signals: string[] = [];
    let isHighRisk = false;

    // 1. Detect Burst Reporting
    const recentIssuesCount = await prisma.issue.count({
      where: {
        reportedById: userId,
        createdAt: { gte: new Date(Date.now() - this.BURST_TIMEFRAME_MS) }
      }
    });

    if (recentIssuesCount > this.BURST_LIMIT) {
      signals.push('BURST_REPORTING');
      isHighRisk = true;
      await this.logSignal({
        userId,
        issueId,
        ipAddress,
        deviceInfo,
        signalType: 'BURST_REPORTING',
        severity: 'HIGH'
      });
    }

    // 2. Detect Repeated Media globally
    if (fileHashes && fileHashes.length > 0) {
      for (const hash of fileHashes) {
        const evidenceCount = await prisma.issueEvidence.count({
          where: { fileHash: hash }
        });
        
        if (evidenceCount > 1) { // If it exists more than once
          signals.push('REPEATED_MEDIA');
          isHighRisk = true;
          await this.logSignal({
            userId,
            issueId,
            ipAddress,
            deviceInfo,
            fileHash: hash,
            signalType: 'REPEATED_MEDIA',
            severity: 'CRITICAL'
          });
        }
      }
    }

    // 3. API Abuse / Suspicious IP mapping (stub logic)
    if (ipAddress) {
      const recentIpSignals = await prisma.riskSignal.count({
        where: {
          ipAddress,
          signalType: 'API_ABUSE',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });
      if (recentIpSignals > 10) {
        signals.push('API_ABUSE');
        isHighRisk = true;
      }
    }

    return { isHighRisk, signals };
  }

  private async logSignal(data: {
    userId: string;
    issueId?: string | undefined;
    ipAddress?: string | undefined;
    deviceInfo?: string | undefined;
    fileHash?: string | undefined;
    signalType: SignalType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    await prisma.riskSignal.create({
      data: {
        userId: data.userId,
        issueId: data.issueId ?? null,
        ipAddress: data.ipAddress ?? null,
        deviceInfo: data.deviceInfo ?? null,
        fileHash: data.fileHash ?? null,
        signalType: data.signalType,
        severity: data.severity
      }
    });
  }
}

export const abuseDetectionService = new AbuseDetectionService();
