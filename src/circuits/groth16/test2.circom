pragma circom 2.2.2;

include "poseidon.circom";
include "comparators.circom";

template Test() {
    signal input x;
    signal output y;
    y <== x;
}

component main = Test();
