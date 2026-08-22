# Aloha-26 Machine and Assembler Specification

## Memory
The memory consists of an array of string elements. 
An array element is a so-called "memory cell" or short a "cell".
Each cell can be accessed by its array element index.
The index of a cell is a natural number.
The first element in the array has index 0.  
A successor element e2 of an element e1 with the index i1 has an index i2 = i1 + 1.

## Cells
A Aloha Machine cell can contain either
- nothing, i.e. it is an empty string, i.e. "nil" or
- an expression

An expression is either
- a natural number or
- [expression], i.e. an expression framed by a pair of brackets


When the program reads an expression it evaluates it.
An expression evaluates 
- to the number if the expression is a number, otherwise:
- to the content of the cell that has the index to which the expression without the outer pair of brackets evaluates. 

Terminology "Referring to cells":
- when we use a number to address a cell with its index, we say the number refers to that cell.
- in an expression [i], the number i refers to the cell with the index i. i framed by the pair of brackets evaluates then to the content of that referred cell i.  

## Assembler Symbols
In Aloha Assembler we can use symbols as Constants names and Jump Targets. A symbol is a sequence of the ASCII characters. 


## Assembler Constants
Constants exist only in Aloha Assembler code. When the Aloha compiler translates the Aloha Asembler code into Aloha Machine code it substitutes the Constants' names with the defined unevaluated expression. Constant names are Aloha Symbols. 
Aloha Assembler knows 2 types of constants:
- predefined: command names are predefined constants, so the Aloha Compiler knows already how to substitute them with a command id when  creating the Aloha Machine code
- explicitely defined: the Constant is defined in the program's Assembler code with the "define" command. The Aloha Compiler substitutes any occurrance of the constant name with its defined value, i.e. the defined unevaluated expression.


## Commands and Arguments
Each command takes 4 cells, i.e one for the command id and 3 successor cells for arguments.
Commands can therefore have up to 3 arguments. 
If a command has less than 3 arguments then the unused cells are nil.

In Aloha Assembler, commands are predefined constants that evaluate to the Aloha machine command id.  

### Command Overview

Here a list of commands and their parameters with data types. 

| Machine Command Id | Assembler Command Name | Parameter 1 | Parameter 2 | Parameter 3 | Explanation | Example |
| -------- | -------- | -------- | ------- | ------- |------- | ------- |
| 05 | define | constant name c: Symbol | value n: natural number || defines explicitely a constant with the name c for the number n; a constant name needs to be unique amongst all constants, may they be predefined (i.e. commands) or explicitely defined  | define NumDimensions 4: NumDimensions is 4 |  
| 10 | import |||| read the next argument in the run command and store it in the next cell; the first import stores the argument into the starting cell idnex given by the aloha runtime; following imports store their read argument values into consecutive cells  | import: put the next number given by the run command in the next cell, starting with the cell from which imports ought to be stored according to the aloha runtime | 
| 20 | add | operand a: expression | operand b: expression | target cell c: expression | add a and b and store the result in the cell with the index c | add [202] [203] [100]: add the evaluated expressions [202] and [203] and store the result in the cell with index [100]; add 3 [12] 12: add 3 to the evaluated expression [12] and store the result in cell 12 |
| 21 | sub | operand a: expression | operand b: expression | target cell c: expression | subtract a from b and store the result in the cell with index c; if the result is less than 0 then raise a runtime error 10 | sub [202] [203] [100]: subtract the evaluated expression [202] from evaluated expression [203] and store the result in the cell with index [100]; sub 3 [12] 12: subtract 3 from the evaluated expression in cell 12 and store the result in cell 12 |
| 30 | nil | cell e: expression ||| puts nil into the cell with the index of the evaluated expression e | nil [202]: set the cell referred to by cell 202 to nil |
| 50 | goto | target cell e: expression ||| set the program counter to evaluated expression e, so the next command being executed is the command that cell contains | goto 653: set the program counter to 653 | 
| 51 | ifEqGoto | operand a: expression | operand b: expression | target cell e: expression | if a equals b then set the program counter to c | ifEqGoto [33] 100 305: if [33] evaluates to 100 then set the program counter to 305 |    
| 52 | #ifGtGoto | operand a: expression | operand b: expression | target cell e: expression | if a is greater than b then set the program counter to c | ifGtGoto [33] 100 305: if [33] evaluates to a number greater than 100 then set the program counter to c |    
| 80 | print | output e: expression ||| print the evaluated expression e to the console |
| 90 | exit |||| stop execution and return to the console from where the run command was launched |  

## Program

Aloha programs can only 
- process an input list of natural numbers and
- output a list of natural numbers as their computation result. 

A Aloha program is a sequence of cell quadruples with an command in the first followed by 3 cells that can contain up to 3 arguments. 

### Assembler format
Aloha Assembler code is reprented as a table in csv format. Rows represent commands with their arguments. The columns are:
1. jump target (optionally): is a constant that marks the command of the row so program execution can jump from some other place to the command in that row as the next one to execute
1. Assembler command name
1. argument 1 i.e. the expression used as value for parameter 1
1. argument 2 i.e. the expression used as value for parameter 2
1. argument 3 i.e. the expression used as value for parameter 3
1. Comment: a text string

### Machine format
Aloha Machine code is represented as a table in csv format. Rows represent memory cells. The columns are:
1. jump target (optionally)
1. cell content, i.e. an expression, that may be interpreted e.g. as a number, a cell index, a command id.  

A command and its arguments allocate 4 consecutive cells, the command id followed by the arguments (or nils). 

## Compiling a Aloha Assembler program into the Aloha Machine code
The Aloha Compiler can compile a program written in Aloha Assembler into Aloha Machine code. The Aloha Compiler can be run from a host machine's shell calling 
```
$ alcomp <Aloha-Assembler-code-file.csv> <Aloha-Machine-code-file.csv>
```
The compiler reads the command quadruples of each row from the Assembler code csv file,  ignoring the rows with the command "define", and assigns the command and its 3 arguments to 4 consecutive cells in the Machine code. 

It substitutes the contant names but not the jump targets. 
It prints the list of constants as pairs of constant name and the unevaluated expression to the console. 

The compiler prints a log with compiler warnings and errors and success messages to the console. 

List of compilation errors:
| Error | Name | Message | Additional data |
| ---- | ---- | ---- | ---- |
| 0001 | compile failure: bad syntax | could not compile program: bad syntax in line: | line number in Assembler code csv file |
| 0002 | compile failure: cannot find jump target | could not find the jump target: | jump target constant name |

## Run a Aloha Machine program
The Aloha Runtime can load a Aloha Machine code program into the Aloha Machine. The Aloha Runtime can be run from a host machine's shell calling 
```
$ aloha <Aloha-Machine-code-file.csv> <cell index with the aloha program command to start with> <cell index from where on the numbers of the input list should be consecutively stored> <the input list of natural numbers>
```

Example: may findMaxNumber be a program that returns the greatest number in the input list, then
```
$aloha findMaxNumber.csv 200 100 34 11 98 9 37 67 
```
starts execution with the executing of the first command i.e. the command in the cell with index 200. Any input value imports of the input list elements, starting here with the value 34, will be stored consecutively in cells starting with index 100.    
Eventually it returns to the console the result 98.

Warning: make sure you leave enough memory cells for the Machine to assign memory cells for the not explicitely defined constants before you allocate memory cells for the imported input values and the program code. 

### Runtime errors
When an unexpected error arises during loading or executing the Machine code program, the aloha Runtime writes an error message to the console.

WHen an loading or execution error occurres the Aloha Runtime writes a dump file. Format of the dump file: for all non nil cells list as a table with rows in ascending order of the cell number: 
1. cell index
1. the unevaluated content of cell 

The name of the dumpfile is: "\<name of the aloha program file that has been executing\>_\<timestamp now\>.dump" with timestamp now is in yyyy-mm-dd_hh-mm-ss format.
Example: findMaxNumber_2026-08-15_21_21-04-13.dump

List of runtime errors:
| Error | Name | Message | Additional data |
| ---- | ---- | ---- | ---- |
| 0100 | runtime error: negative number | value is a negative number: | number and the cell index of the command being executed |
| 0101 | runtime error: cell access failure | cell id is negative or expression parsing error: | the unevaluated expression |

