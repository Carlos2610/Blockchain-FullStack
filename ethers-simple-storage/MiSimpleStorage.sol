//MI SMART CONTRACT
pragma solidity 0.8.7;

contract SimpleStorage {
    //todos los smart contracts tienen una direccion/address
    //types: boolean, uint, int, address, bytes
    bool hasFavouriteNumber;
    uint256 public favouriteNumber = 5;
    string favouriteNumberInText = "Five";
    int256 favoriteInt = -5;
    address myAddress = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
    bytes32 favouriteBytes = "cat";

    //variable mapping
    mapping(string => uint256) public nameToFavNumber;

    //struct : se indexan sus elementos al igual que las variables
    struct Person {
        uint256 favNumber;
        string name;
    }

    Person public person = Person({favNumber: 2, name: "jhony"});

    //Array estatico
    Person[3] public people_static;

    //Array dinamico
    Person[] public people;

    function addPerson(string memory _name, uint256 _favN) public {
        Person memory newPerson = Person(_favN, _name);
        people.push(newPerson);
    }

    //function con mapping (son conjuntos clave valor)
    function addPersonMapping(string memory _name, uint256 _favN) public {
        people.push(Person(_favN, _name));
        nameToFavNumber[_name] = _favN;
    }

    function store(uint256 _favNumber) public virtual {
        favouriteNumber = _favNumber;
    }

    function retrieve() public view returns (uint256) {
        return favouriteNumber;
    }
}
