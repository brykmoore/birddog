using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MoodFinder;
using MoodFinder.Domain;
using MoodFinder.StringMatching;

namespace Tester
{
    public class fulltweets
    {
        public Int64 id { get; set; }
        public string text { get; set; }
        public decimal bing_positive { get; set; }
        public decimal bing_negative { get; set; }
        public decimal D_Happiness { get; set; }
        public decimal D_Caring { get; set; }
        public decimal D_Depression { get; set; }
        public decimal D_Inadequateness { get; set; }
        public decimal D_Fear { get; set; }
        public decimal D_Confusion { get; set; }
        public decimal D_Hurt { get; set; }
        public decimal D_Anger { get; set; }
        public decimal D_Loneliness { get; set; }
        public decimal D_Remorse { get; set; }
    }

    class Program
    {
        static void Main(string[] args)
        {
            Stemming_Setup();
            var input = "I spent like 30 minutes installing Netflix on my Xbox to find out that I needed fucking gold membership... fuck you microsoft...";
            var returnValue = processBingLiu(input);
            var item = new fulltweets();
            var positive = returnValue.Where(x => x.Category == "Positive").ToList();
            var negative = returnValue.Where(x => x.Category == "Negative").ToList();
            if (positive != null && positive.Count > 0)
            {
                item.bing_positive = (int)positive.First().Count;
            }
            else
            {
                item.bing_positive = 0;
            }
            if (negative != null && negative.Count > 0)
            {
                item.bing_negative = (int)negative.First().Count;
            }
            else
            {
                item.bing_negative = 0;
            }

                var something = item;
            
        }
        private static List<MoodFrequencyItem> processBingLiu(string inputString)
        {
            var list = bingliuTrie.Find(inputString).GroupBy(x => new { x.Value.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Value.Weight),
                Word = g.Select(x=>x.Word).ToList()
            }).ToList();


            return list;
        }
        private static void Stemming_Setup()
        {
            stemmer = new Stemming();
            moodList = new MoodListing().BingLiuMoodList;
            bingliuTrie = new Trie<MoodItem>();
            var bingLiuMoodList = new List<MoodItem>();
            foreach (var item in moodList)
            {
                var stemmed = stemmer.Stem(item.Word);//removed stemming
                bingLiuMoodList.Add(new MoodItem { Word = item.Word, Value = item.Value });
            }

            bingLiuMoodList = bingLiuMoodList.Distinct().ToList();

            foreach (var item in bingLiuMoodList)
            {
                bingliuTrie.Add(" " + item.Word + " ", item);
            }

            bingliuTrie.Build();

            drummondMoodList = new MoodListing().DrummondMoodList;
            drummondTrie = new Trie<MoodValue>();

            foreach (var item in drummondMoodList)
            {
                var stemmed = stemmer.Stem(item.Word);
                drummondTrie.Add(stemmed, item.Value);
            }

            drummondTrie.Build();
        }

        private static Trie<MoodItem> bingliuTrie;
        private static Trie<MoodValue> drummondTrie;
        private static List<MoodItem> drummondMoodList;
        private static Stemming stemmer;
        private static List<MoodItem> moodList;
    }
}
