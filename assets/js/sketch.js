var HEIGHT = 8
var WIDTH = 8
var MINES = 8
var board
var minesweeper
var minesweeper_ai
var gameOver = false

function runGame(){
    document.querySelector('.withoutGame').style.display = "none";
    document.querySelector('.withGame').style.display = "flex";
    resetGame()
}

function resetGame(){
    board = new Board()
    minesweeper = new MineSweeper(HEIGHT,WIDTH,MINES)
    minesweeper_ai = new MineSweeperAI(HEIGHT,WIDTH,MINES)
    gameOver = false
    document.querySelector('.message').innerHTML = ""
}

function aiMove(){
    move = minesweeper_ai.make_safe_move() || minesweeper_ai.make_random_move()
    if(!move){
        console.log("No Moves Left!!")
        stopGame(minesweeper.won())
        return
    }
    makeMove(move)
}

function makeMove(cell){
    if (gameOver)
        return
    if(minesweeper.is_mine(cell)){
        stopGame(false)
        return
    }

    minesweeper_ai.add_knowledge(cell,minesweeper.nearby_mines(cell))
    board.markCell(cell,minesweeper.nearby_mines(cell))

    minesweeper.mines_found = minesweeper_ai.getFlags()
    for(var flag of minesweeper.mines_found){
        board.addFlag(flag)
    }

    if(minesweeper.won()){
        stopGame(true)
    }
}

function toggleFlag(cell){
    if (gameOver)
        return
    board.toggleFlag(cell)
}

function showAllMines(){
    for(var mine of minesweeper.getMines()){
        board.markMine(mine)
    }
}

function stopGame(win) {
    gameOver = true
    if(!win){
        showAllMines()
        document.querySelector('.message').innerHTML = "Loose 😵😵"
    }else{
        document.querySelector('.message').innerHTML = "Won 🎉🎊"
    }
}


class Board{
    constructor(){
        this.clean()
    }

    clean = function(){
        for(var cell of document.querySelectorAll(".cell")){
            cell.setAttribute("class","cell")
            cell.innerHTML = ""
        }
    }

    markMine = function(cell) {
        var i = cell[0]
        var j = cell[1]
        var cell = document.querySelector("#x"+i.toString()+"x"+j.toString())
        if(cell.innerHTML == ""){
            cell.setAttribute("class","cell mine")
        }
    }

    toggleFlag = function(cell) {
        var i = cell[0]
        var j = cell[1]
        var cell = document.querySelector("#x"+i.toString()+"x"+j.toString())
        if(cell.innerHTML == ""){
            cell.classList.toggle("flag")
        }
    }

    addFlag = function(cell) {
        var i = cell[0]
        var j = cell[1]
        var cell = document.querySelector("#x"+i.toString()+"x"+j.toString())
        if(cell.innerHTML == ""){
            cell.setAttribute("class","cell flag")
        }
    }

    markCell = function(cell,n) {
        var i = cell[0]
        var j = cell[1]
        var cell = document.querySelector("#x"+i.toString()+"x"+j.toString())
        if(!cell.classList.contains("flag")){
            cell.setAttribute("class","cell")
            cell.innerHTML = n.toString()
        }
    }
}

class MineSweeperAI{
    /*
    Minesweeper game player
    */

    constructor(height=8, width=8){
        // Set initial height and width
        this.height = height
        this.width = width

        // Keep track of which cells have been clicked on
        this.moves_made = new MySet()
        this.all_possible_cells = new MySet()
        for(var h of range(height)){
            for(var w of range(width)){
                this.all_possible_cells.add([h,w])
            }
        }

        // Keep track of cells known to be safe or mines
        this.mines = new MySet()
        this.safes = new MySet()

        // List of sentences about the game known to be true
        this.knowledge = []
    }

    mark_mine(cell){
        /*
        Marks a cell as a mine, and updates all knowledge
        to mark that cell as a mine as well.
        */
        this.mines.add(cell)
        for(var sentence of this.knowledge){
            sentence.mark_mine(cell)
        }
    }

    mark_safe(cell){
        /*
        Marks a cell as safe, and updates all knowledge
        to mark that cell as safe as well.
        */
        // Remove addition of this.safes because of different algorithm
        for(var sentence of this.knowledge){
            sentence.mark_safe(cell)
        }
    }

    add_knowledge(cell, count){
        /*
        Called when the Minesweeper board tells us, for a given
        safe cell, how many neighboring cells have mines in them.

        This function should:
            1) mark the cell as a move that has been made
            2) mark the cell as safe
            3) add a new sentence to the AI's knowledge base
               based on the value of `cell` and `count`
            4) mark any additional cells as safe or as mines
               if it can be concluded based on the AI's knowledge base
            5) add any new sentences to the AI's knowledge base
               if they can be inferred from existing knowledge
        */
        this.moves_made.add(cell)
        this.mark_safe(cell)
        
        var new_knowledge_cells = []

        // Loop over 3x3 cells and appending untouched cells to new_knowledge_cells
        for(var i of range(cell[0] - 1, cell[0] + 2)){
            for(var j of range(cell[1] - 1, cell[1] + 2)){

                // Ignore the cell itthis
                if([i, j].equals(cell)){
                    continue
                }

                // Update count if cell in bounds and is mine
                if(0 <= i && i < this.height && 0 <= j && j < this.width){
                    if(!(this.moves_made.has([i,j]) || this.safes.has([i,j]))){
                        new_knowledge_cells.push([i,j])
                    }

                }
            }
        }

        // Appending the new Knowledge
        if(new_knowledge_cells.length != 0){
            this.knowledge.push(new Sentence(new_knowledge_cells,count))
        }
    
        while(this.minify_knowledgebase() != this.knowledge){
            continue
        }

        
    
        // console.log("Move: ",cell)
        // console.log("Knowledge Base:")
        // for(var sentence of this.knowledge){
        //     console.log(sentence)
        // }
        
        // console.log("\nConfirmed Safe:")
        // console.log(this.safes)
    
        // console.log("\nConfirmed Mines:")
        // console.log(this.mines)

    }                    

    make_safe_move(){
        /*
        Returns a safe cell to choose on the Minesweeper board.
        The move must be known to be safe, and not already a move
        that has been made.

        This function may use the knowledge in this.mines, this.safes
        and this.moves_made, but should not modify any of those values.
        */
        if(this.safes.size > 0){
            return this.safes.pop()
        }
        return false
    }

    make_random_move(){
        /*
        Returns a move to make on the Minesweeper board.
        Should choose randomly among cells that:
            1) have not already been chosen, and
            2) are not known to be mines
        */
        var freeSets = this.all_possible_cells.difference(this.moves_made).difference(this.mines)
        if(freeSets.size > 0){
            return Array.from(freeSets)[randint(freeSets.size)]
        }
        return false
    }

    minify_knowledgebase(){
        var knowledge_to_iterate = [...this.knowledge]

        for(var sentence of knowledge_to_iterate){
            var known_safes = sentence.known_safes()
            var known_mines = sentence.known_mines()
            
            if(known_safes){
                this.safes = this.safes.union(known_safes)
                this.knowledge.delete(sentence)
            }

            if(known_mines){
                this.knowledge.delete(sentence)
                for(var mine of known_mines.union(this.mines)){
                    this.mark_mine(mine)
                }
            }
        }
        
        return this.knowledge
    }

    getFlags(){
        /*
        Return all mines found till now
        */
        return this.mines
    }

}

class Sentence{
    /*
    Logical statement about a Minesweeper game
    A sentence consists of a set of board cells,
    and a count of the number of those cells which are mines.
    */

    constructor(cells, count){
        this.cells = new MySet(cells)
        this.count = count
    }

    known_mines(){
        /*
        Returns the set of all cells in this.cells known to be mines.
        */
        if (this.cells.size == this.count){
            return this.cells
        }
        return false
    }

    known_safes(){
        /*
        Returns the set of all cells in this.cells known to be safe.
        */
        if(this.count == 0){
            return this.cells
        }
        return false
    }

    mark_mine(cell){
        /*
        Updates internal knowledge representation given the fact that
        a cell is known to be a mine.
        */
        if(this.cells.has(cell)){
            this.cells.delete(cell)
            this.count -= 1
            return true
        }
        return false
    }

    mark_safe(cell){
        /*
        Updates internal knowledge representation given the fact that
        a cell is known to be safe.
        */
        if(this.cells.has(cell)){
            this.cells.delete(cell)
            return true
        }
        return false
    }
}

class MineSweeper{
    // Set initial width, height, and number of mines
    constructor(height,width,mines){
        this.height = height
        this.width = width
        this.mines = new MySet()

        // Initialize an empty field with no mines
        this.board = []
        for(var i of range(this.height)){
            var row = []
            for(var j of range(this.width)){
                row.push(false)
            }
            this.board.push(row)
        }

        // Add mines randomly
        while(this.mines.size != mines){
            var i = randint(height)
            var j = randint(width)
            
            if (!this.board[i][j]){
                this.mines.add([i, j])
                this.board[i][j] = true
            }
        }

        // At first, player has found no mines
        this.mines_found = new MySet()
    }

    is_mine(cell){
        var i = cell[0]
        var j = cell[1]
        return this.board[i][j]
    }

    nearby_mines(cell){
        /*
        Returns the number of mines that are
        within one row and column of a given cell,
        not including the cell itthis.
        */

        // Keep count of nearby mines
        var count = 0

        // Loop over all cells within one row and column
        for(var i of range(cell[0] - 1, cell[0] + 2)){
            for(var j of range(cell[1] - 1, cell[1] + 2)){

                // Ignore the cell itthis
                if([i, j].equals(cell)){
                    continue
                }

                // Update count if cell in bounds and is mine
                if(0 <= i && i < this.height && 0 <= j && j < this.width){
                    if(this.board[i][j]){
                        count += 1
                    }
                }
            }
        }

        return count
    }

    won(){
        /* 
        Checks if all mines have been flagged.
        */
        return this.mines_found.difference(this.mines).size == 0 && this.mines.size == this.mines_found.size
    }

    getMines(){
        var mines = []
        for(var i of range(this.height)){
            for(var j of range(this.width)){
                if(this.board[i][j]){
                    mines.push([i,j])
                }
            }
        }
        return this.mines
    }
}

/* ---------- Custom Functions to extend the functionality ----------*/
function randint(n){
    return Math.floor(Math.random()*n)
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

// Writing My Own Set To make it functional like Python
class MySet extends Set{
    add(elem){
        if(!this.has(elem)){
            super.add(elem)
        }
        return this
    }

    union(set){
        let _union = new MySet(this)
        for (let elem of set) {
            _union.add(elem)
        }
        return _union
    }
    
    intersection(set){
        let _intersection = new MySet()
        for (let elem of set) {
            if (this.has(elem)) {
                _intersection.add(elem)
            }
        }
        return _intersection
    }

    has(elem){
        if(!Array.isArray(Array.from(this)[0])){
            return super.has(elem)
        }
        for(var e of Array.from(this)){
            if(elem.equals(e)){
                return true
            }
        }
        return false
    }

    difference(set) {
        let _difference = new MySet(this)
        for (let elem of set) {
            _difference.delete(elem)
        }
        return _difference
    }
    

    delete(elem){
        if(!Array.isArray(elem)){
            return super.delete(elem)
        }
        if(!this.has(elem)){
            return false
        }
        for (let el of this) {
            if (el.equals(elem)) {
                super.delete(el)
                return el
            }
        }
        return false
    }

    pop(){
        var elem = Array.from(this).pop()
        this.delete(elem)
        return elem
    }
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}


Array.prototype.delete = function (elem) {
    // if the other array is a falsy value, return
    if (!elem)
        return false;

    if(this.indexOf(elem) != -1){
        this.splice(this.indexOf(elem),1)
        return true
    }
    
    return false;
}

// Removing Right Click to call a function
function runOnLoad() {
    if(window.innerWidth < 700){
        var mvp = document.getElementById('myViewport');
        mvp.setAttribute('content','width=700 user-scalable=0');
    }

    document.addEventListener('contextmenu', event => event.preventDefault());

    for(var i of range(HEIGHT)){
        for(var j of range(WIDTH)){
            document.getElementById("x"+i.toString()+"x"+j.toString()).addEventListener("click", function(e){
                cell = [parseInt(this.id.split(`x`)[1]),parseInt(this.id.split(`x`)[2])]
                makeMove(cell)
            });
            document.getElementById("x"+i.toString()+"x"+j.toString()).addEventListener("contextmenu", function(e){
                cell = [parseInt(this.id.split(`x`)[1]),parseInt(this.id.split(`x`)[2])]
                toggleFlag(cell)
            });
        }
    }
}