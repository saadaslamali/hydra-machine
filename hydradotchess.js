//what we want-
//chess moves control the visuals being shown on the board
//moves mapped to (srcs, modulates, effects,), numbers (randomize number and choose a random parameter),
//add or remove (not src or numbers) 

//decide (add, remove or edit)
//edit: if modulate or blend(change the src inside, or one of the numbers)
//      if src, change the numbers inside (random number)
// +/- 0.1, 1, *0.1,*-1

//only allow 2 layers 
//main function 
//  modulate/blend inside the main ( src inside the modulate, number, number )
//  color/transform effect (number, number)

// On move
// Pawn: randomize one number, move up or down
// Bishop: Add a transform effect, default params * random[0,1] 
// Knights: Add a color effect