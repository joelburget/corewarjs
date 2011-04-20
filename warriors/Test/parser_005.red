dec7    equ     dat #1, #1
        equ     dat $1, $1
        equ     dat @1, @1
        equ     dat *1, *1
        equ     dat {1, {1
        equ     dat }1, }1
        equ     dat <1, <1

decoy   dec7
        dec7            ; 21-instruction decoy
        dec7