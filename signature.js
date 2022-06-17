signTypedDataV4Button.addEventListener('click', function (event) {
    event.preventDefault();

    const msgParams = JSON.stringify({
        EIP712Domain: {
            chainId: 3,
            name: 'AirDrop',
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
            version: '1',
        },
        Drop: {
            recepient: recepient_,
            amount: amount_,
            DeadLine: deadline_
        },
        primaryType: 'Drop',
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
            Drop: [
                { name: 'recepient_', type: 'address' },
                { name: 'amount_', type: 'uint256' },
                { name: 'deadline_', type: 'uint256' },
            ],
        },
    });

    var from = web3.eth.accounts[0];

    var params = [from, msgParams];
    var method = 'eth_signTypedData_v4';

    web3.currentProvider.sendAsync(
        {
            method,
            params,
            from,
        },
        function (err, result) {
            if (err) return console.dir(err);
            if (result.error) {
                alert(result.error.message);
            }
            if (result.error) return console.error('ERROR', result);
            console.log('TYPED SIGNED:' + JSON.stringify(result.result));

            const recovered = sigUtil.recoverTypedSignature_v4({
                data: JSON.parse(msgParams),
                sig: result.result,
            });

            if (
                ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)
            ) {
                alert('Successfully recovered signer as ' + from);
            } else {
                alert(
                    'Failed to verify signer when comparing ' + result + ' to ' + from
                );
            }
        }
    );
});