
# Aloha-26 Specifications

## Terminology
### Base Terms
| Term | Explanation |
| -------- | -------- |
| towel   | a towel can carry a riddle or is null, see below; each towel has a natural number as unique towel id; the first towel has the id 0; if the towel is folded, it cannot carry shells; it is null |
| beach   | a place where an infinite number of towels can be placed |
| shell   | shells are items that can be placed on towels; no shells denotes 0, one shell 1, and so on |
| shaman | has infinite number of shells at hand; can look up the riddle on a given towel; can place shells on a towel and take away shells from a towel; can perform various towel exercises, see below |

### Dealing with towels and shells

A not folded, i.e. not-null, towel carries either an exercise id or a riddle.  
A riddle always represents a natural number. 

A riddle is either
- a number of shells or
- two chicken bones left and right and a riddle in-between 

We call a riddle that is a number of shells with two chicken bones left and right a "real riddle". When the lifeguard evaluates a real riddle, he replaces the shells with the surrounding pair of bones by the a copy of the content of the towel that has the id that equals the number of shells in the riddle. 

When intending to put shells on a folded towel, i.e. the towel is null, then it unfolds automatically.  

### Riddle Notation
The shaman can note towel riddles in his own language:
- five shells on a towel is 5
- 7 shells surrounded by a pair of 2 checken bones, i.e. [7], evaluates to the number of shells on the towel with the id 7
- [[11]] is the number of shells on the towel with the id being equal to the number of shells on towel 11. In other words, if the towel with the id 11 carries 9 shells, and the towel with id 9 carries 8 shells, then [[11]] is 8 shells 
- and so on

### Exercises
An inscribed stone tablet passed down by the ancestors shows a list of exercises that instruct the shaman what actions to take. Exercises have none, 1, 2 or 3 arguments. An exercises is placed on 4 consecutive towels, with the first towel carrying the exercise id number of an execise. In case the exercise less than 3 arguments the remainng towels stay empty.

The shaman puts the Magic Stone on the towel with the first exercise as given by the run command. After having done an exercise he puts the magic stone on the towel with which he is told to proceed next. 

| Exercise Id | Exercise Name | Explanation | Example |
| -------- | -------- | ------- | ------- |
| 10 | swallow <riddle r> | read the next argument in the run command and stores it on the given towel with id r | swallow 13: puts the number of shells given by the run command on the towel 13 | 
| 20 | dumpontop <riddle a> <riddle b> <riddle c> | empty the towel first then put the same number of shells as given by "a" on the towel with the id given by "c" and put the number of shells as given by "b" also on the same towel. | dumpontop [202] [203] [100]: take the same number of shells as on towels 202 and 203 and place them towel with the id that is equal to the riddle in 100; dumpontop 3 [12] 12: put 3 shells to the shells on towel with the id 12 |
| 25 | fold <riddle a> | set the towel with the id as given by "a" | dumpontop [202] [203] [100]: take the same number of shells as on towels 202 and 203 and place them towel with the id that is equal to the riddle in 100; dumpontop 3 [12] 12: put 3 shells to the shells on towel with the id 12 |
| 30 | goto <riddle a> | put the Magic stone on the towel with the id "a" | goto 653: put the Magic Stone on the towel with the id 653 | 
| 31 | ifeqgoto <riddle a> <riddle b> <riddle c> | if number of shells of "a" equals the number of shells of "b" then put the Magic Stone on the towel with the id "c" | ifeqgoto [33] 100 305: if [33] evaluates to a number that equals 100 then put the Magic Stone on the towel with the id 305 |    
| 32 | ifgtgoto <riddle a> <riddle b> <riddle c> | if number of shells of "a" is greater than the number of shells of "b" then put the Magic Stone on the towel with the id "c" | ifgtgoto [33] 100 305: if [33] evaluates to a number that is greater than 100 then put the Magic Stone on the towel with the id 305 |    
| 80 | proclaim <riddle a> | proclaim to the people the number given by "a" |
| 99 | withdraw | do not continue to do exercises |  