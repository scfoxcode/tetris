
// Note - iterating over 2d array, I do y then x so it matches the visual representation

var tetrisShapes = // SHAPES MUST BE SQUARE OR MOVE LEGAL AND HELPER FUNCTIONS MIGHT BREAK!!
{
    squiggleBlock:
    {
        color:"orange.png",
        shape:
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    iSquiggleBlock:
    {
        color:"green.png",
        shape:
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    },
    square:
    {
        color:"red.png",
        shape:
        [
            [1 ,1],
            [1, 1]
        ]
    },
    line:
    {
        color:"lightBlue.png",
        shape:
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    },
    lBlock:
    {
        color:"blue.png",
        shape:
        [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ]
    },
    iLBlock:
    {
        color:"purple.png",
        shape:
        [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0]
        ]
    },
    tBlock:
    {
        color:"yellow.png",
        shape:
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    }
};

// Clones the 2d shape array and returns
var cloneShapeArray = function(shape)
{
    var newShape = [];
    for(var i=0; i<shape.length; i++)
    {
        newShape[i] = [];
        for(var j=0; j<shape[i].length; j++)
        {
            newShape[i][j] = shape[i][j];
        }
    }
    return newShape;
};

var cloneShape = function(shape) // This is needed because we will be rotating the shape
{
    var s = tetrisShapes[shape];
    if(!s)
    {
        console.log("Warning, invalid shape specified, picking square instead");
        s = tetrisShapes["square"];
    }
    var newShape = {};
    newShape.color = s.color;
    newShape.shape = cloneShapeArray(s.shape);
    return newShape;
};

// shapeCellPos - the position of the shape in cell co-ordinates
// localCellPos - the position of the cell inside the shape
var localCellToWorldCell = function(shapeCellPos, localCellPos)
{
    return(
    {
        x:shapeCellPos.x + localCellPos.x,
        y:shapeCellPos.y + localCellPos.y
    });
};

var worldToCell = function(position, cellSize)
{
    return {x:position.x%cellSize.x, y:position.y%cellSize.y};
};

var cellToWorld = function(cell, cellSize)
{
    return {x:cell.x*cellSize, y:cell.y*cellSize};
};

var drawCell = function(ctx, color, worldPosition, cellSize)
{
    ctx.drawImage(ctx.tetrisImages[color], worldPosition.x, worldPosition.y, cellSize, cellSize);
};

TetrisShape = function()
{
    this.type = "";
    this.position = {x:0, y:0};
    this.init = function(type)
    {
        this.type = type;
        // Refactor note, this being in data is bad, should have a this.shape
        this.data = cloneShape(type);
    };
};

// Hopefully rotates right 90 degrees
// Don't forget to check if rotation is legal
TetrisShape.prototype.rotate = function(grid) // collisionWithGrid
{
    var self = this;
    var original = cloneShapeArray(this.data.shape); // We need this for rotation legal I think
    var shape = cloneShapeArray(this.data.shape);

    var finalizeShape = function() // I don't like this here, should be moved
    {
        self.data.shape = shape; // Set the shape
        var result = self.overBorder(grid);
        if(result) // Border collision, apply appropriate movement
        {
            if(result.y != 0) // bottom collision, don't allow movement on rotate
            {
                self.data.shape = original;
                return;
            }
            self.position.x += result.x;
            self.position.y += result.y;
        }
        if(!self.moveLegal(grid, null, true))
        {
            if(result) // Revert movement
            {
                self.position.x -= result.x;
                self.position.y -= result.y;
            }
            self.data.shape = original; // Collision, do not allow rotation
        }
    };

    if(this.type == "square") // Can't rotate a square
    {
        return;
    }
    else if(this.type == "line") // This one is tricky so special case
    {                            // Don't like this special case
        if(shape[0][1]) // Currently vertical
        {
            shape =
                [
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0]
                ]
        }
        else
        {
            shape =
                [
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0]
                ]
        }
        finalizeShape();
        return;
    }
    // Normal 3 by 3 rotate 90 degrees - y then x remember for visual reasons
    var temp = shape[0][0];
    shape[0][0] = shape[2][0]; // Corners first
    shape[2][0] = shape[2][2];
    shape[2][2] = shape[0][2];
    shape[0][2] = temp;

    temp = shape[0][1];
    shape[0][1] = shape[1][0];
    shape[1][0] = shape[2][1];
    shape[2][1] = shape[1][2];
    shape[1][2] = temp;

    finalizeShape();
};

TetrisShape.prototype.spacesLeft = function() // Number of empty columns on left
{
    var minSpace = 5;
    var shape = this.data.shape;
    for(var i=0; i<shape.length; i++)
    {
        for(var j=0; j<shape[i].length; j++)
        {
            if(shape[i][j] == 1 && j < minSpace)
            {
                minSpace = j;
                break;
            }
        }
    }
    return minSpace;
};

TetrisShape.prototype.spacesRight = function() // Number of empty columns on left
{
    var minSpace = 5;
    var shape = this.data.shape;
    for(var i=0; i<shape.length; i++)
    {
        var notJ = -1;
        for(var j=shape[i].length-1; j>-1; j--)
        {
            notJ++;
            if(shape[i][j] == 1 && notJ < minSpace)
            {
                minSpace = notJ;
                break;
            }
        }
    }
    return minSpace;
};

TetrisShape.prototype.spacesBottom = function() // Number of empty columns at the bottom
{
    var minSpace = 5;
    var shape = this.data.shape;
    var notJ = -1;
    for(var i=shape.length-1; i>-1; i--)
    {
        notJ++;
        for(var j=0; j<shape[i].length; j++)
        {
            if(shape[i][j] == 1 && notJ < minSpace)
            {
                minSpace = notJ;
                return minSpace;
            }
        }
    }
    return minSpace;
};

TetrisShape.prototype.collisionWithGrid = function(grid, direction)
{
    if(!direction)
    {
        direction = {x:0, y:0};
    }

    // Ghost the movement and convert co-ordinates
    var newPos = {x:this.position.x+direction.x, y:this.position.y+direction.y};
    var shape = this.data.shape;
    var activeCells = [];
    for(var i=0; i<shape.length; i++)
    {
        for(var j=0; j<shape[i].length; j++)
        {
            if(shape[i][j])
            {
                activeCells.push(localCellToWorldCell(newPos, {x:j, y:i}));
            }
        }
    }
    for(i=0; i<activeCells.length; i++)
    {
        if(grid[activeCells[i].x][activeCells[i].y])
        {
            return true;
        }
    }
    return false;
};

// Optional direction to be applied
TetrisShape.prototype.overBorder = function(grid, direction)
{
    var rightBorder = grid.length;
    var bottomBorder = grid[0].length;
    var spacesLeft = this.spacesLeft();
    var spacesRight = this.spacesRight();
    var spacesBottom = this.spacesBottom();

    // Return the movement required to make it valid
    if((!direction || direction.x < 0) && (this.position.x + spacesLeft) <= 0)
    {
        return {x:(this.position.x + spacesLeft)*-1, y:0};
    }
    if((!direction || direction.x > 0) && (this.position.x - spacesRight + this.data.shape.length) >= rightBorder)
    {
        return {x:-(this.position.x - spacesRight + this.data.shape.length - rightBorder), y:0};
    }
    if((!direction || direction.y > 0) && (this.position.y - spacesBottom + this.data.shape.length) >= bottomBorder)
    {
        return {x:0, y:-(this.position.y - spacesBottom + this.data.shape.length-bottomBorder)};
    }
    return false;
};

// Third flag is optional, will be filled with data in event of collision
TetrisShape.prototype.moveLegal = function(grid, direction, skipBorderCheck)
{
    if(!direction)
    {
        direction = {x:0, y:0}; // For rotation tests
    }

    if((!skipBorderCheck && this.overBorder(grid, direction)) ||
        this.collisionWithGrid(grid, direction))
    {
        return false;
    }

    return true;
};

TetrisShape.prototype.move = function(grid, direction)
{
    if(!this.moveLegal(grid, direction))
    {
        return false;
    }
    this.position.x += direction.x;
    this.position.y += direction.y;
    return true;
};

TetrisShape.prototype.draw = function(ctx, cellSize)
{
    var worldPosition = cellToWorld(this.position, cellSize);
    var shape = this.data.shape;
    var color = this.data.color;
    for(var i=0; i<shape.length; i++)
    {
        for(var j=0; j<shape[i].length; j++)
        {
            if(shape[i][j] != 1)
            {
                continue;
            }
            var position = {x:worldPosition.x + cellSize*j, y:worldPosition.y + cellSize*i};
            drawCell(ctx, color, position, cellSize);
        }
    }
};

Tetris = function(canvas) // Id of the canvas to draw to, id of the controls div
{
    this.canvas = document.getElementById(canvas);
    this.controls = document.getElementById("topGame");
    this.ctx = this.canvas.getContext("2d");
    this.level = 1; // Current level. Each level increase will decrease game loop interval by 25;
    this.defaultDelay = 500;
    this.delay = this.defaultDelay;
    this.canvasSize = {x:parseInt(this.canvas.width), y:parseInt(this.canvas.height)};
    this.loopTimeout = null; // Holds game loop timeout reference
    this.activeShape = null; // Current active shape, if null create new

    this.ctx.tetrisImages = {}; // We need to create image objects for drawCell to use
    var images = ["blue.png", "green.png", "lightBlue.png", "orange.png", "purple.png", "red.png", "yellow.png"];
    for(var i=0; i<images.length; i++)
    {
        this.ctx.tetrisImages[images[i]] = new Image();
        this.ctx.tetrisImages[images[i]].src = images[i];
    }
    this.initControls();
};

Tetris.prototype.initControls = function()
{
    var music = document.getElementById("music");

    var score = document.getElementById("topMiddle");
    score.className = "tetrisScore";
    score.textContent = 0;
    score.currentScore = 0;

    var mute = document.getElementById("muteButton");
    mute.muted = false;
    mute.src = "soundon.png";
    mute.onclick = function()
    {
        this.muted = !this.muted;
        this.src = this.muted ? "soundoff.png" : "soundon.png";
        if (music.paused)
        {
            music.play();
        }
        else
        {
            music.pause();
        }
    };
};

Tetris.prototype.setScore = function(value)
{
    var score = document.getElementById("topMiddle");
    score.currentScore = value;
    score.textContent = value;
};

Tetris.prototype.addScore = function(value)
{
    var score = document.getElementById("topMiddle");
    score.currentScore += value;
    score.textContent = score.currentScore;
    this.delay = this.defaultDelay - 25*(this.level-1);
    if(this.delay < 50)
    {
        this.delay = 50;
    }
};

Tetris.prototype.zeroScore = function()
{
    var score = document.getElementById("topMiddle");
    score.currentScore = 0;
    score.textContent = 0;
};

// Start Draw Functions
Tetris.prototype._drawGrid = function(grid, cellSize, gridSize)
{
    var ctx = this.ctx;
    var canvasSize = this.canvasSize;
    for(var i=0; i<gridSize.x; i++)
    {
        for(var j=0; j<gridSize.y; j++)
        {
            if(grid[i][j])
            {
                // This should be optimised, dont want to redraw unless I have to...
                // Maybe a second array of bools, whether or not to update that square, or maybe that row
                drawCell(ctx, grid[i][j], cellToWorld({x:i, y:j}, cellSize), cellSize);
            }
        }
    }
};

Tetris.prototype._redraw = function()
{
    var ctx = this.ctx;

    // Clear grid with background color
    ctx.beginPath();
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    ctx.closePath();

    this._drawGrid(this.grid, this.cellSize, this.gridSize);
    if(this.activeShape)
    {
        this.activeShape.draw(this.ctx, this.cellSize);
    }
};

// End Draw Functions
Tetris.prototype._createGrid = function(gridSize)
{
    var grid = [];
    for(var i=0; i<gridSize.x; i++)
    {
        grid[i] = [];
        for(var j=0; j<gridSize.y; j++)
        {
            grid[i][j] = null;
        }
    }
    return grid;
};

Tetris.prototype.userInput = function(self, data)
{
    if(self.activeShape)
    {
        if(data && (data.key == 'w' || data.key == 'ArrowUp'))
        {
            self.activeShape.rotate(self.grid);
        }
        else if(data && (data.key == 'a' || data.key == 'ArrowLeft'))
        {
            self.activeShape.move(self.grid, {x:-1, y:0});
        }
        else if(data && (data.key == 'd' || data.key == 'ArrowRight'))
        {
            self.activeShape.move(self.grid, {x:1, y:0});
        }
        else if(data && (data.key == 's' || data.key == 'ArrowDown'))
        {
            self.activeShape.move(self.grid, {x:0, y:1});
        }
        else if(data && data.code == 'Space')
        {
            // This is not efficient but it was too cool to resist
            while(self.activeShape.move(self.grid, {x:0, y:1}));
        }
        self._redraw();
    }
};

Tetris.prototype.init = function(cellSize, gridSize)
{
    this.cellSize = cellSize;
    this.gridSize = gridSize;
    this.grid = this._createGrid(gridSize);
    this.shapes = [];
    for(var it in tetrisShapes) // Add all shape names to array
    {
        if(tetrisShapes.hasOwnProperty(it))
        {
            this.shapes.push(it);
        }
    }

    var self = this;
    document.onkeydown = function(data)
    {
        Tetris.prototype.userInput(self, data);
    };
};

// Flags cells on the grid for drawing based on shape
Tetris.prototype._shapeToGrid = function(shape)
{
    //localCellToWorldCell
    var shapeGrid = shape.data.shape;
    for(var i=0; i<shapeGrid.length; i++)
    {
        for(var j=0; j<shapeGrid[i].length; j++)
        {
            if(!shapeGrid[i][j])
            {
                continue;
            }
            var coords = localCellToWorldCell(shape.position, {x:j, y:i});
            this.grid[coords.x][coords.y] = shape.data.color;
        }
    }
};

Tetris.prototype._clearFullLines = function()
{
    var fullRows = []; // Y values of full rows
    for(var i=0; i<this.gridSize.y; i++)
    {
        var fullRow = true;
        for(var j=0; j<this.gridSize.x; j++)
        {
            if(!this.grid[j][i])
            {
                fullRow = false;
                break;
            }
        }
        // Order is important, I think. We must clear top to bottom
        if(fullRow)
        {
            fullRows.push(i);
        }
    }
    if(!fullRows.length)
    {
        return 0;
    }
    else if(fullRows.length == 4) // Tetris
    {
        this.addScore(800);
    }
    else
    {
        this.addScore(100*fullRows.length);
    }

    for(i=0; i<fullRows.length; i++) // For each row cleared, top to bottom
    {
        for(j=0; j<this.gridSize.x; j++) // Clear the line
        {
            this.grid[j][fullRows[i]] = null;
        }
        // Move all rows above this down one
        for(j=fullRows[i]-1; j>0; j--)
        {
            for(var k=0; k<this.gridSize.x; k++) // Copy to line below
            {
                this.grid[k][j+1] = this.grid[k][j];
                this.grid[k][j] = null; // Clear the line we copied from
                // Only really essential for the top line
            }
        }
    }
};

Tetris.prototype.newBlock = function()
{
    return this.shapes[Math.floor(Math.random()*this.shapes.length)];
};

Tetris.prototype._innerGameLoop = function()
{
    if(this.activeShape)
    {
        if(!this.activeShape.move(this.grid, {x:0, y:1}))
        {
            // Cannot move down
            this._shapeToGrid(this.activeShape);
            this.activeShape = null; // We need a new active shape
        }
        this._clearFullLines();
        this._redraw();
    }
    else // We need to create a new shape
    {
        this.activeShape = new TetrisShape();
        this.activeShape.init(this.newBlock()); // lBlock
        this.activeShape.position.x = Math.floor(this.gridSize.x/2 - this.activeShape.data.shape.length/2);
        if(!this.activeShape.moveLegal(this.grid, null, true))
        {
            clearTimeout(this.loopTimeout); // game is over
        }
    }
    this._redraw();
};

Tetris.prototype._gameLoop = function()
{
    var self = this;
    this.loopTimeout = setTimeout(function()
    {
        self._gameLoop();
    }, this.delay);
    self._innerGameLoop();
};

Tetris.prototype.run = function()
{
    this._gameLoop();
};





