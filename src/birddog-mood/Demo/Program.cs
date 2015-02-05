using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Iveonik.Stemmers;
using MoodFinder;
using MoodFinder.Domain;
using MoodFinder.StringMatching;

namespace Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            var text = "cheerful hello fond of";
            //lowercase
            text = text.ToLower();
            //strip punctuation
            text = new string(text.Where(x => !char.IsPunctuation(x)).ToArray());
            //var stemmer = new EnglishStemmer();

            var stemmer = new Stemming();
            var trie = new Trie<MoodValue>();
            var moodList = new MoodListing().MoodList;

            foreach (var item in moodList)
            {
                trie.Add(stemmer.Stem(item.Word), item.Value);
            }

            trie.Build();

            var matches = Regex.Matches(text, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var item in matches)
            {
                inputString += stemmer.Stem(item.ToString()) + " ";
            }
            var list = trie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x=>x.Weight)
            }).ToList();

            var moodResults = moodList.Select(x => x.Value.Category).Distinct().Select(y => new MoodFrequencyItem {
            Category = y
            }).ToList();
            var sum = list.Sum(mood => mood.Count);

            foreach (var mood in list)
            {
                var firstOrDefault = moodResults.FirstOrDefault(x => x.Category == mood.Category);
                if(firstOrDefault != null)
                {
                    firstOrDefault.Count = mood.Count / sum;
                }
            }
        }
    }
}
