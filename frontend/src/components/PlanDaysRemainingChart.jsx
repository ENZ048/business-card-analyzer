import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

const PlanDaysRemainingChart = ({ daysRemaining, planEndDate, isPlanExpired, planType }) => {
  // Validate and sanitize input values
  const safeDaysRemaining = isNaN(daysRemaining) || daysRemaining === null || daysRemaining === undefined ? 0 : Math.max(0, Number(daysRemaining));
  const safeIsPlanExpired = Boolean(isPlanExpired);
  const safePlanType = planType || 'Free Plan';
  
  // Calculate total days in the plan period (assuming 30 days for monthly plans)
  const totalDays = 30; // This could be made dynamic based on plan validity
  const daysUsed = Math.max(0, totalDays - safeDaysRemaining);
  
  // Colors based on status
  const remainingColor = safeIsPlanExpired ? '#ef4444' : safeDaysRemaining <= 7 ? '#f59e0b' : '#10b981';
  const usedColor = '#e5e7eb';

  // Calculate percentages for the pie chart
  const remainingPercentage = (safeDaysRemaining / totalDays) * 100;
  const usedPercentage = (daysUsed / totalDays) * 100;

  // Calculate the rotation angle for the remaining days
  const remainingAngle = (remainingPercentage / 100) * 360;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white border border-premium-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-premium-black">Plan Status</h3>
          <p className="text-sm text-premium-gray">Days remaining in your {safePlanType}</p>
        </div>
        <div className="flex items-center">
          {safeIsPlanExpired ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : safeDaysRemaining <= 7 ? (
            <Clock className="h-5 w-5 text-amber-500" />
          ) : (
            <Calendar className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Custom CSS Pie Chart */}
        <div className="w-full lg:w-1/2 h-64 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Outer pie chart using conic-gradient */}
            <div
              className="w-full h-full rounded-full relative overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                background: `conic-gradient(
                  ${remainingColor} 0deg ${remainingAngle}deg,
                  ${usedColor} ${remainingAngle}deg 360deg
                )`
              }}
            >
              {/* Inner circle for donut effect */}
              <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <div className="text-3xl font-bold text-premium-black mb-1">
                    {safeIsPlanExpired ? '!' : safeDaysRemaining}
                  </div>
                  <div className="text-sm text-premium-gray">
                    {safeIsPlanExpired ? 'Expired' : 'days left'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart border for better definition */}
            <div className="absolute inset-0 rounded-full border-2 border-premium-border"></div>
            
            {/* Progress indicator dots */}
            <div className="absolute inset-0 rounded-full">
              {/* Remaining days indicator */}
              {remainingAngle > 0 && (
                <div
                  className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${remainingAngle}deg) translateY(-120px)`,
                    backgroundColor: remainingColor
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="text-center lg:text-left">
            <div className="text-3xl font-bold text-premium-black mb-2">
              {safeIsPlanExpired ? 'Expired' : safeDaysRemaining}
            </div>
            <p className="text-premium-gray">
              {safeIsPlanExpired ? 'Plan has expired' : 'days remaining'}
            </p>
          </div>

          {planEndDate && (
            <div className="text-center lg:text-left">
              <p className="text-sm text-premium-gray">
                Plan ends on {new Date(planEndDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center lg:justify-start">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                safeIsPlanExpired
                  ? 'bg-red-100 text-red-800'
                  : safeDaysRemaining <= 7
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {safeIsPlanExpired
                ? 'Expired - Renew Now'
                : safeDaysRemaining <= 7
                ? 'Expiring Soon'
                : 'Active'}
            </span>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-premium-beige transition-colors">
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: remainingColor }}
              ></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-premium-black">
                  Days Remaining
                </span>
                <div className="text-xs text-premium-gray">
                  {safeDaysRemaining} days ({remainingPercentage.toFixed(1)}%)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-premium-beige transition-colors">
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: usedColor }}
              ></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-premium-black">
                  Days Used
                </span>
                <div className="text-xs text-premium-gray">
                  {daysUsed} days ({usedPercentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanDaysRemainingChart;
