using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MoodFinder.Domain;
using MoodFinder.StringMatching;
using Iveonik.Stemmers;

namespace MoodFinder
{
    public class MoodFinder
    {
        public async Task<object> GetMoodBasedOnPoms(object input)
        {
            IDictionary<string, object> payload = (IDictionary<string, object>)input;

            var text = (string)payload["text"];
            var analyzer = new Analyzer(new Stemming(), new MoodListing().DrummondMoodList);
            var moodResults = analyzer.Analyze(text);
            return moodResults;
        }
    }

    //move to new file
    public class Analyzer
    {
        private IStem _stemmer;
        private IEnumerable<MoodItem> _moodListing;
        public Analyzer(IStem stemmer, IEnumerable<MoodItem> moodListing)
        {
            _stemmer = stemmer;
            _moodListing = moodListing;
        }

        private Trie<MoodValue> BuildTrie()
        {
            var trie = new Trie<MoodValue>();

            foreach (var item in _moodListing)
            {
                trie.Add(item.Word, item.Value);
            }

            return trie;
        }

        public List<MoodFrequencyItem> Analyze(string input)
        {
            //lowercase
            input = input.ToLower();
            //strip punctuation
            input = new string(input.Where(x => !char.IsPunctuation(x)).ToArray());

            var trie = BuildTrie();

            var matches = Regex.Matches(input, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var item in matches)
            {
                inputString += _stemmer.Stem(item.ToString()) + " ";
            }

            var list = trie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Weight)
            }).ToList();

            var moodResults = _moodListing.Select(x => x.Value.Category).Distinct().Select(y => new MoodFrequencyItem
            {
                Category = y
            }).ToList();

            var sum = list.Sum(mood => mood.Count);

            foreach (var mood in list)
            {
                var firstOrDefault = moodResults.FirstOrDefault(x => x.Category == mood.Category);
                if (firstOrDefault != null)
                {
                    firstOrDefault.Count = mood.Count / sum;
                }
            }
            return moodResults;
        } 
    }


}
