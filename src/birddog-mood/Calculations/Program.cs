using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Calculations
{
    class Program
    {
        static void Main(string[] args)
        {
            var symbol = "MSFT";
            var threshold = 50;
            using (var db = new birddogEntities()) {
            
                double positiveCount = db.analyses.Where(x=>x.symbol == symbol && x.@class == "pos").Count();
                double negativeCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neg").Count();
                double neutralCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neu").Count();

                double positiveHighCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "pos" && x.bing_positive > threshold).Count();
                double negativeHighCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neg" && x.bing_positive > threshold).Count();
                double neutralHighCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neu" && x.bing_positive > threshold).Count();

                double positiveLowCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "pos" && x.bing_positive <= threshold).Count();
                double negativeLowCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neg" && x.bing_positive <= threshold).Count();
                double neutralLowCount = db.analyses.Where(x => x.symbol == symbol && x.@class == "neu" && x.bing_positive <= threshold).Count();

                double count = db.analyses.Where(x => x.symbol == symbol).Count();
                double highCount = db.analyses.Where(x => x.symbol == symbol && x.bing_positive > threshold).Count();
                double lowCount = db.analyses.Where(x => x.symbol == symbol && x.bing_positive <= threshold).Count();

                var totalEntropy = ((positiveCount / count) * Math.Log((positiveCount / count), 2)) +
                    ((negativeCount / count) * Math.Log(negativeCount / count, 2)) +
                    ((neutralCount / count) * Math.Log(neutralCount / count, 2));
                totalEntropy = -1 * totalEntropy;

                var highEntropy = ((positiveHighCount / highCount) * Math.Log((positiveHighCount / highCount), 2)) +
                    ((negativeHighCount / highCount) * Math.Log(negativeHighCount / highCount, 2)) +
                    ((neutralHighCount / highCount) * Math.Log(neutralHighCount / highCount, 2));

                highEntropy = -1 * highEntropy;

                var lowEntropy = ((positiveLowCount / lowCount) * Math.Log((positiveLowCount / lowCount), 2)) +
                    ((negativeLowCount / lowCount) * Math.Log(negativeLowCount / lowCount, 2)) +
                    ((neutralLowCount / lowCount) * Math.Log(neutralLowCount / lowCount, 2));
                lowEntropy = -1 * lowEntropy;

                var result = totalEntropy - (((highCount / count) * highEntropy) + ((lowCount / count) * lowEntropy));
                    //((@positive/@count)*(LOG(@positive/@count)/LOG(2))+ (@negative/@count)*(LOG(@negative/@count)/LOG(2)) + (@neutral/@count)*(LOG(@neutral/@count)/LOG(2)));
            }
        }
        
    }
}
