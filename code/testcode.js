class TestClass{
    constructor(integer1, integer2){
        if(integer1 != 5) this.error = true;
        this.integer1 = integer1;
        this.integer2 = integer2;
    }

    toJSON(){
        return { '1':this.integer1, '2':this.integer2 };
    }
}

class TestClass2 extends TestClass{
    constructor(integer1, integer2, integer3){
        super(integer1, integer2);
        this.integer3 = integer3;
    }

    toJSON(){
        return { '1': this.integer1, '2': this.integer2, '3': this.integer3 };
    }
}

var test = function(){
    var newtestclass = new TestClass(5, 6);
    var newtest2class = new TestClass2(9, 6, 7);
    console.log(newtestclass);
    console.log(newtest2class);
}

module.exports = {
    test: test
}