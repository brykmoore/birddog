using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MoodFinder.Domain
{
    public class Stemming : IStem
    {
        public List<StemmingRule> rules
        {
            get
            {
                return new List<StemmingRule>{
                            new StemmingRule{   Suffix = "ies", Result = "y", Number = 3  },
                            new StemmingRule{   Suffix = "ing", Result = "", Number = 3  },
                            new StemmingRule{   Suffix = "ness", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ss     ", Result = "ss", Number = 0  },
                            new StemmingRule{   Suffix = "s", Result = "", Number = 3  },
                            new StemmingRule{   Suffix = "ion", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ism", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ly", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "eed", Result = "ee", Number = 3  },
                            new StemmingRule{   Suffix = "ied", Result = "y", Number = 4  },
                            new StemmingRule{   Suffix = "ed", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ed", Result = "e", Number = 3  },
                            new StemmingRule{   Suffix = "er", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ful", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "able", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "ible", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "v", Result = "f", Number = 3  },
                            new StemmingRule{   Suffix = "e", Result = "", Number = 4  },
                            new StemmingRule{   Suffix = "dd", Result = "d", Number = 3  },
                            new StemmingRule{   Suffix = "gg", Result = "g", Number = 3  },
                            new StemmingRule{   Suffix = "ll", Result = "l", Number = 3  },
                            new StemmingRule{   Suffix = "mm", Result = "m", Number = 3  },
                            new StemmingRule{   Suffix = "nn", Result = "n", Number = 3  },
                            new StemmingRule{   Suffix = "pp", Result = "p", Number = 3  },
                            new StemmingRule{   Suffix = "rr", Result = "r", Number = 3  },
                            new StemmingRule{   Suffix = "ss", Result = "s", Number = 3  },
                            new StemmingRule{   Suffix = "tt", Result = "t", Number = 3  }
                    };
            }
        }
        public Stemming()
        {
        }       

        public string Stem(string input)
        {
            var word = input;
            bool finished = false;
            while (!finished)
            {
                for (int i = 0; i < rules.Count; i++)
                {
                    var index = word.IndexOf(rules[i].Suffix, System.StringComparison.Ordinal);

                    if (index >= rules[i].Number)
                    {
                        var newWord = word.Replace(rules[i].Suffix, rules[i].Result);
                        if (newWord == word)
                        {
                            finished = true;
                        }
                        else
                        {
                            word = newWord;
                        }
                        break;
                    }

                    if(i == rules.Count - 1)
                    {
                        finished = true;
                    }
                }
            }
            return word;
        }
    }
    public class StemmingRule
    {
        public string Suffix { get; set; }
        public string Result { get; set; }
        public int Number { get; set; }
    }
}
