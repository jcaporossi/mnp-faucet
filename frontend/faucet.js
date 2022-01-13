$(document).ready(function () {
  //////////////////////////////////////////////////////////////////////////////
  ////     INSERT YOUR NODE RPC URL, NETWORK ID AND GAS PRICE HERE        //////
  //////////////////////////////////////////////////////////////////////////////
  var rpcURL = "http://localhost:8545";
  var networkID = 31337;
  var minGasPrice = 20000000000;
  //////////////////////////////////////////////////////////////////////////////
  ////     INSERT THE TOKEN AND FAUCET ADDRESS HERE                       //////
  //////////////////////////////////////////////////////////////////////////////
  var token_address = "0x9C4d0ee808D806258da04696d20cddDB56eB4171";
  var faucet_address = "0x8c80724fe54c1F71a70D09AdC106691F8811Cea8";
  //////////////////////////////////////////////////////////////////////////////
  var faucet_admin = "0x4DCDFC072d1Df391e7f93BbB0814128F606B45de";

  var account;
  var web3Provider;

  var contract_token;
  var contract_faucet;

  var balanceETH = 0;
  var balanceToken = 0;

  function initialize() {
    setAccount();
  }

  function setAccount() {
    console.log("set Account");
    web3.eth.net.getId(function (err, netId) {
      if (!err && netId == networkID) {
        $("#wrong_network").fadeOut(1000);
        setTimeout(function () {
          $("#correct_network").fadeIn();
          $("#faucet").fadeIn();
        }, 1000);
        web3.eth.getAccounts().then((accounts) => {
          account = accounts[0];
          $("#address").text(accounts[0]);
          if (account === faucet_admin) {
            $("#mintButton").removeAttr("disabled");
          }
          web3.eth.getBalance(accounts[0], function (err, res) {
            if (!err) {
              balanceETH = Number(web3.utils.fromWei(res, "ether"));
              $("#balanceETH").text(balanceETH + " ETH");
              $("#balanceETH").show();
            }
          });
          contract_token.methods.balanceOf(account).call({ from: account }, function (err, result) {
            if (!err) {
              $("#balanceToken").text(web3.utils.fromWei(balanceToken.toString(), "ether") + " $MONO");
              if (Number(result) != balanceToken) {
                balanceToken = Number(result);
                $("#balanceToken").text(web3.utils.fromWei(balanceToken.toString(), "ether") + " $MONO");
              }
            }
          });
          var tokenAmount = 0;
          contract_faucet.methods.tokenAmount().call(function (err, result) {
            if (!err) {
              tokenAmount = result;
              $("#requestButton").text("Request " + web3.utils.fromWei(result, "ether") + " $MONO Tokens");
            }
          });
          contract_token.methods.balanceOf(faucet_address).call({}, function (errCall, result) {
            if (!errCall) {
              $("#balance").text(web3.utils.fromWei(result.toString(), "ether") + " $MONO left");
              if (result < tokenAmount) {
                $("#warning").html("Sorry - the faucet is out of tokens! But don't worry, we're on it!");
              } else {
                contract_faucet.methods.allowedToWithdraw(account).call({}, function (err, result) {
                  if (!err) {
                    if (result && balanceToken < tokenAmount * 1000) {
                      $("#requestButton").removeAttr("disabled");
                    } else {
                      contract_faucet.methods.waitTime().call(function (err, result) {
                        if (!err) {
                          $("#warning").html(
                            "Sorry - you can only request tokens every " + result / 60 + " minutes. Please wait!"
                          );
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        });
      }
    });
  }

  function getTestTokens() {
    $("#requestButton").attr("disabled", true);
    web3.eth.getTransactionCount(account, function (errNonce, nonce) {
      if (!errNonce) {
        contract_faucet.methods
          .requestTokens()
          .send(
            { value: 0, gas: 200000, gasPrice: minGasPrice, from: account, nonce: nonce },
            function (errCall, result) {
              if (!errCall) {
                $("#requestButton").attr("disabled", false);
                $("#requestResult").text("Success \\o/");
                contract_token.methods.balanceOf(account).call({ from: account }, function (err, result) {
                  if (!err) {
                    balanceToken = Number(result);
                    $("#balanceToken").text(web3.utils.fromWei(balanceToken.toString(), "ether") + " $MONO");
                  }
                });
              } else {
                $("#requestButton").attr("disabled", false);
                $("#requestResult").text("Failure :((");
              }
            }
          );
      }
    });
  }

  function mintTestTokens() {
    $("#mintButton").attr("disabled", true);
    web3.eth.getTransactionCount(account, function (errNonce, nonce) {
      if (!errNonce) {
        contract_token.methods
          .mint(faucet_address, web3.utils.toWei("1000", "ether"))
          .send(
            { value: 0, gas: 200000, gasPrice: minGasPrice, from: account, nonce: nonce },
            function (errCall, result) {
              if (!errCall) {
                $("#mintButton").attr("disabled", false);
                $("#mintResult").text("Success \\o/");
              } else {
                $("#mintButton").attr("disabled", false);
                $("#mintResult").text("Failure :((");
              }
            }
          );
      }
    });
  }

  $("#rpc_url").text(rpcURL);
  $("#network_id").text(networkID);

  if (typeof window.ethereum !== "undefined") {
    window.ethereum.send("eth_requestAccounts");
    web3 = new Web3(window.ethereum);

    $.getJSON("json/erc20.json", function (data) {
      contract_token = new web3.eth.Contract(data, token_address);
    });
    $.getJSON("json/faucet.json", function (data) {
      contract_faucet = new web3.eth.Contract(data, faucet_address);
    });

    setTimeout(function () {
      initialize();
    }, 1000);

    let tokenButton = document.querySelector("#requestButton");
    tokenButton.addEventListener("click", function () {
      getTestTokens();
    });

    let mintButton = document.querySelector("#mintButton");
    mintButton.addEventListener("click", function () {
      mintTestTokens();
    });
  }
});
