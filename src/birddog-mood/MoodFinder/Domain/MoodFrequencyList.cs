using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MoodFinder;

namespace MoodFinder.Domain
{
    public class MoodFrequencyList
    {

            public static List<MoodFrequencyItem> MoodList()
            {

                var categories = Enum.GetNames(typeof(MoodCategories)).ToList();
    
                var list = new List<MoodFrequencyItem>();
                foreach (var category in categories)
                {
                    list.Add(new MoodFrequencyItem { Category = category, Count = 0 });
                }
                return list.OrderBy(x=>x.Category.ToString()).ToList();

            }
    }

    public class MoodFrequencyItem
    {
        public string Category { get; set; }
        public double Count { get; set; }

    }
    
}
