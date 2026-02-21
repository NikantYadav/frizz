/**
 * Off-chain reputation score calculation
 * This allows you to change the formula without redeploying the contract
 */

/**
 * Calculate reputation score from raw stats
 * @param {Object} stats - Raw reputation stats from contract
 * @param {number} stats.completedJobs - Number of completed jobs
 * @param {number} stats.disputeWins - Number of disputes won
 * @param {number} stats.disputeLosses - Number of disputes lost
 * @param {number} stats.totalVolume - Total USDC volume (6 decimals)
 * @param {number} stats.ratingsSum - Sum of all ratings (1-5 scale)
 * @param {number} stats.ratingCount - Number of ratings received
 * @returns {Object} Calculated reputation metrics
 */
function calculateReputationScore(stats) {
  // Base score: 50 points
  let baseScore = 50;
  
  // Rating component: Average rating * 10 (max 50 points)
  let ratingScore = 0;
  if (stats.ratingCount > 0) {
    const avgRating = stats.ratingsSum / stats.ratingCount;
    ratingScore = avgRating * 10; // 5.0 rating = 50 points
  }
  
  // Experience bonus: +1 per job, capped at 20 points
  let jobBonus = Math.min(stats.completedJobs, 20);
  
  // Dispute penalty: -15 per loss
  let disputePenalty = stats.disputeLosses * 15;
  
  // Calculate total score
  let totalScore = baseScore + ratingScore + jobBonus - disputePenalty;
  
  // Clamp between 0 and 100
  totalScore = Math.max(0, Math.min(100, totalScore));
  
  // Calculate additional metrics
  const avgRating = stats.ratingCount > 0 
    ? stats.ratingsSum / stats.ratingCount 
    : 0;
  
  const disputeWinRate = (stats.disputeWins + stats.disputeLosses) > 0
    ? (stats.disputeWins / (stats.disputeWins + stats.disputeLosses)) * 100
    : 0;
  
  const volumeInUSDC = stats.totalVolume / 1e6; // Convert from 6 decimals
  
  return {
    score: Math.round(totalScore),
    averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    completedJobs: stats.completedJobs,
    disputeWinRate: Math.round(disputeWinRate),
    totalVolumeUSDC: volumeInUSDC,
    breakdown: {
      baseScore,
      ratingScore: Math.round(ratingScore),
      jobBonus,
      disputePenalty
    }
  };
}

/**
 * Alternative scoring formula (example)
 * You can easily switch between different formulas
 */
function calculateReputationScoreV2(stats) {
  // Different weights and formula
  let score = 0;
  
  // Weighted average rating (40% weight)
  if (stats.ratingCount > 0) {
    const avgRating = stats.ratingsSum / stats.ratingCount;
    score += (avgRating / 5) * 40;
  }
  
  // Job completion (30% weight)
  const jobScore = Math.min(stats.completedJobs / 50, 1) * 30;
  score += jobScore;
  
  // Dispute win rate (20% weight)
  const totalDisputes = stats.disputeWins + stats.disputeLosses;
  if (totalDisputes > 0) {
    const winRate = stats.disputeWins / totalDisputes;
    score += winRate * 20;
  } else {
    score += 10; // Neutral score if no disputes
  }
  
  // Volume bonus (10% weight)
  const volumeInUSDC = stats.totalVolume / 1e6;
  const volumeScore = Math.min(volumeInUSDC / 10000, 1) * 10;
  score += volumeScore;
  
  return {
    score: Math.round(score),
    formula: "v2"
  };
}

/**
 * Get reputation badge based on score
 */
function getReputationBadge(score) {
  if (score >= 90) return { badge: "Elite", color: "#FFD700", icon: "⭐⭐⭐" };
  if (score >= 75) return { badge: "Expert", color: "#C0C0C0", icon: "⭐⭐" };
  if (score >= 60) return { badge: "Professional", color: "#CD7F32", icon: "⭐" };
  if (score >= 40) return { badge: "Intermediate", color: "#4A90E2", icon: "✓" };
  return { badge: "Beginner", color: "#95A5A6", icon: "○" };
}

/**
 * Example usage with ethers.js
 */
async function getReputationForUser(reputationContract, userAddress) {
  // Fetch raw stats from contract
  const stats = await reputationContract.getReputation(userAddress);
  
  // Convert BigNumber to regular numbers
  const rawStats = {
    completedJobs: stats.completedJobs.toNumber(),
    disputeWins: stats.disputeWins.toNumber(),
    disputeLosses: stats.disputeLosses.toNumber(),
    totalVolume: stats.totalVolume.toNumber(),
    ratingsSum: stats.ratingsSum.toNumber(),
    ratingCount: stats.ratingCount.toNumber()
  };
  
  // Calculate score off-chain
  const reputation = calculateReputationScore(rawStats);
  const badge = getReputationBadge(reputation.score);
  
  return {
    ...reputation,
    ...badge
  };
}

/**
 * Batch calculate reputation for multiple users
 */
async function getReputationBatch(reputationContract, userAddresses) {
  const reputations = await Promise.all(
    userAddresses.map(address => getReputationForUser(reputationContract, address))
  );
  
  return userAddresses.map((address, i) => ({
    address,
    ...reputations[i]
  }));
}

/**
 * Example: Display reputation in frontend
 */
function displayReputation(reputation) {
  return `
    <div class="reputation-card">
      <div class="score">${reputation.score}/100</div>
      <div class="badge ${reputation.badge.toLowerCase()}">
        ${reputation.icon} ${reputation.badge}
      </div>
      <div class="stats">
        <div>⭐ ${reputation.averageRating}/5.0 (${reputation.completedJobs} jobs)</div>
        <div>🏆 ${reputation.disputeWinRate}% dispute win rate</div>
        <div>💰 $${reputation.totalVolumeUSDC.toLocaleString()} volume</div>
      </div>
    </div>
  `;
}

module.exports = {
  calculateReputationScore,
  calculateReputationScoreV2,
  getReputationBadge,
  getReputationForUser,
  getReputationBatch,
  displayReputation
};
