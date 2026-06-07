import { Shield, CheckCircle, Award, Star, Zap, Clock } from "lucide-react";

interface TrustBadgesProps {
  isVerified?: boolean;
  isPremium?: boolean;
  rating?: number;
  reviewCount?: number;
  responseTime?: string;
  tripsCompleted?: number;
  memberSince?: string;
  compact?: boolean;
}

export default function TrustBadges({
  isVerified, isPremium, rating, reviewCount,
  responseTime, tripsCompleted, memberSince, compact = false
}: TrustBadgesProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {isVerified && (
          <span className="flex items-center gap-0.5 text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
            <Shield size={8}/> Verified
          </span>
        )}
        {isPremium && (
          <span className="flex items-center gap-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">
            <Award size={8}/> Premium
          </span>
        )}
        {rating && rating > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
            <Star size={8} className="fill-amber-400"/> {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {isVerified && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <Shield size={16} className="text-blue-600 dark:text-blue-400 shrink-0"/>
          <div>
            <div className="text-xs font-black text-blue-700 dark:text-blue-300">Verified</div>
            <div className="text-[10px] text-muted-foreground">ID checked</div>
          </div>
        </div>
      )}
      {isPremium && (
        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
          <Award size={16} className="text-yellow-600 dark:text-yellow-400 shrink-0"/>
          <div>
            <div className="text-xs font-black text-yellow-700 dark:text-yellow-400">Premium</div>
            <div className="text-[10px] text-muted-foreground">Top operator</div>
          </div>
        </div>
      )}
      {rating && rating > 0 && reviewCount && reviewCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <Star size={16} className="text-amber-500 fill-amber-400 shrink-0"/>
          <div>
            <div className="text-xs font-black text-amber-700 dark:text-amber-400">{rating.toFixed(1)} Rating</div>
            <div className="text-[10px] text-muted-foreground">{reviewCount} reviews</div>
          </div>
        </div>
      )}
      {tripsCompleted && tripsCompleted > 0 && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0"/>
          <div>
            <div className="text-xs font-black text-green-700 dark:text-green-400">{tripsCompleted} Trips</div>
            <div className="text-[10px] text-muted-foreground">Completed</div>
          </div>
        </div>
      )}
      {responseTime && (
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
          <Zap size={16} className="text-purple-600 dark:text-purple-400 shrink-0"/>
          <div>
            <div className="text-xs font-black text-purple-700 dark:text-purple-400">{responseTime}</div>
            <div className="text-[10px] text-muted-foreground">Response time</div>
          </div>
        </div>
      )}
      {memberSince && (
        <div className="flex items-center gap-2 bg-muted border border-border rounded-xl p-3">
          <Clock size={16} className="text-muted-foreground shrink-0"/>
          <div>
            <div className="text-xs font-black text-foreground">Since {memberSince}</div>
            <div className="text-[10px] text-muted-foreground">Member</div>
          </div>
        </div>
      )}
    </div>
  );
}
