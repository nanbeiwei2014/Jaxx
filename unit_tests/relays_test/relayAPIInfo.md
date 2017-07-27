# Fields used in Jaxx API


## Transaction List
    1) transaction List
        ### Transaction List Item Details
            1) amount
            2) confirmations
            3) time
            4) tx hash
    2) unconfirmed transactions


## Transaction Details

    ### Transaction
        1) transaction id
        2) transaction block
        3) transaction 
        4) time stamp 

    ### Inputs  

        1) input address
        2) input amount
        3) previous transaction id
        4) previous index
        5) is standard?

    ### Outputs 

        1) output address
        2) output amount
        3) is output spend
        4) is output standard

## Balance 
    1) balance



## Blockr
    ### Transaction List
        1) Transaction List -> Details

            1) response.data.txs[i].amount
            2) response.data.txs[i].confirmations
            3) response.data.txs[i].time_utc
            4) response.data.txs[i].tx

        2) ? 
    
    ### Transaction Details

        #### Transaction

            1) response.data.tx
            2) response.data.block
            3) response.data.confirmations
            4) response.data.time_utc

        #### Inputs

            1) response.data.vins[0].address
            2) response.data.vins[0].amount
            3) response.data.vins[0].vout_tx
            4) response.data.vins[0].n
            5) response.data.vins[0].in_nonstandard 

        #### Outputs

            1) response.data.vouts[i].address
            2) response.data.vouts[i].amount
            3) response.data.vouts[i].is_spent
            4) response.data.vouts[i].is_nonstandard
    
    ### Balance
        
        1) response.data.balance

## Blockexplorer
    ### Transaction List

        1) Transaction List -> Details
            
            1) response.txs[i].valueIn
            2) response.txs[i].confirmations
            3) response.txs[i].time
            4) response.txs[i].txid
            
        2) ??


    ### Transaction Details 
    
        #### Transaction

            1) reponse.txid 
            2) response.blockheight
            3) response.confirmations
            4) response.time 

        #### Inputs 

            1) response.vin[0].addr
            2) response.vin[0].value
            3) response.vin[0].txid
            4) response.vin[0].vout
            5) standard - field does not exist

        #### Outputs

            1) response.vout[i].scriptPubKey.addresses[0]
            2) response.vout[i].value
            3) response.vout[i].spentTxId
            4) standard - field does not exist
            
    ### Balance 
        
        1) response.balance 
	
## Blockcypher
    // TODO: Format Numbers for consistancy with other relays (use Blockr as base)	
    
    ### Transaction List
       1) Transaction List -> Details
            1) response.txrefs[i].value
            2) response.txrefs[i].confirmations
            3) response.txrefs[i].confirmed
            4) response.txrefs[i].tx_hash
            
        2) response.unconfirmed_n_tx
    
    ### Transaction Details 
    
        #### Transaction
            1) response.hash
            2) response.block_height
            3) response.confirmations
            4) response.confirmed

        #### Inputs 

            1) response.inputs[0].addresses[0]
            2) response.inputs[0].output_value
            3) response.inputs[0].prev_hash
            4) response.inputs[0].output_index
            5) standard - field does not exist

        #### Outputs
            1) response.outputs[i].addresses[0]
            2) response.outputs[i].value
            3) response.outputs[i].spent_by 
            4) standard - field does not exist
            
    ### Details 
        
        1) response.balance
	
	
