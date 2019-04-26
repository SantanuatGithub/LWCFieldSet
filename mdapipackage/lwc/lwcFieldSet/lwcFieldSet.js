import { LightningElement, api, track, wire } from 'lwc';
import getFields from '@salesforce/apex/FieldSetController.getFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import SAVE from '@salesforce/label/c.fieldsetSave';
import CANCEL from '@salesforce/label/c.fieldsetCancel';
import SAVE_TITLE from '@salesforce/label/c.fieldsetSaveTitle';
import SAVE_MESSAGE from '@salesforce/label/c.fieldsetSaveMessage';

export default class LwcFieldSet extends NavigationMixin(LightningElement) {
    
    @api title;
    @api iconName;
    @api sobjectName;
    @api fieldSetName;
    @api recordTypeId;
    @api recordId;
    @api objectApiName;
    @api columns;
    @api redirectToTargetRecord;
    @api sectionMap;
    @api readOnly;
    @api refreshAfterSave;
    @api keepSaveButton;
    @api noSectionHeader;
    @api readOnlyMode;
    
    @track columnProperty;
    @track fields;
    @track currentfields;
    @track error;
    @track noSectionHeader;
    
    @wire(CurrentPageReference)
    currentPageReference; 

    fieldValueArray = [];
    fieldName;
    currentFieldName;
    currentFieldValue;
    startingIndex=0;
    fieldObj={};
    fieldValueObj = {};
    section = [];
    start = 0;
    end = 0;
    secNextItem = -1;
    numberOfFields;  
    hasTitle; 

    save = SAVE;
    cancel = CANCEL;
      
    connectedCallback(){
        getFields({sObjectName: this.sobjectName, fieldSetName: this.fieldSetName  })
            .then(result => {                
                this.fields = result;                
                this.error = undefined;
            }).catch(error => {
                this.error = error;
                this.fields = undefined;
        });   
        if(this.sectionMap !== null ){
            this.section = [];
            for(let count in this.sectionMap){
                if (Object.prototype.hasOwnProperty.call(this.sectionMap, count)){
                    this.section.push({
                        key:count,
                        value:this.sectionMap[count]
                    });                 
                }
            }
        } 

        if(this.title !== undefined)
            this.hasTitle = true;
        this.columnProperty = "slds-p-horizontal--small slds-size--1-of-1 slds-medium-size--" + 6/this.columns+ "-of-6 slds-large-size--" + 12/this.columns + "-of-12";
    }
     
    
    get currentRecordId(){
        
        if(this.objectApiName!== undefined && !this.readOnlyMode)
            return null;
        
        return this.recordId;

    }
    
    get saveButtonVisibility(){
        if(this.keepSaveButton && !this.readOnlyMode)
            return true;
        
        return false;

    }

    get firstSecLoop(){
        if(!this.noSectionHeader)
            this.slicedfields();
        return true;
    }

      
    slicedfields(){
        this.start = this.end;
        this.secValue();
        if(this.start === 0){
            this.end = this.numberOfFields;
        }
        else
            this.end = +this.start + +this.numberOfFields;

        this.currentfields =  this.fields.slice(this.start, this.end);
    }

 
    secValue(){
        this.secNextItem ++;
        this.numberOfFields = this.section[this.secNextItem].value;
    }
    

    captureFieldValues(event){      
        
        this.currentFieldName = event.target.fieldName;
        this.currentFieldValue = event.target.value;

         
        if(this.startingIndex > 1){
    		if(this.fieldName === this.currentFieldName && this.fieldValueArray != null)
    			this.fieldValueArray.pop(); 
    		else
    			this.fieldName = this.currentFieldName;

   			this.fieldObj[this.currentFieldName] = this.currentFieldValue;
   			this.fieldValueArray.push(this.fieldObj);
   		}
		else if(this.startingIndex === 1){
			this.fieldObj[this.currentFieldName] = this.currentFieldValue;
			this.fieldValueArray.push(this.fieldObj);	
			this.startingIndex = 2;
			this.fieldName = this.currentFieldName;
		}
		else{           
			this.fieldObj[this.currentFieldName] = this.currentFieldValue;
   			this.fieldValueArray.push(this.fieldObj);
            this.startingIndex = 1;            
        }
    }

    @api 
    doSave(addedFields){        
         
        if(this.fields !== null && this.fieldValueArray !== null){
			for(let outercount in this.fields){
                if (Object.prototype.hasOwnProperty.call(this.fields, outercount)){
                    for(let innercount in this.fieldValueArray){
                        if (Object.prototype.hasOwnProperty.call(this.fieldValueArray, innercount)){
                            if(this.fieldValueArray[innercount][this.fields[outercount]]){
                                this.fieldValueObj[this.fields[outercount]] = this.fieldValueArray[innercount][this.fields[outercount]];
                            }
                            innercount++;
                        }
                    }
                    outercount++; 
                }  
	    	} 
        }

        if(addedFields) {
            let keys = Object.keys(addedFields);   
            if(this.keys !== null && this.fieldValueObj != null){        
                for(let count in keys){
                    if (Object.prototype.hasOwnProperty.call(keys, count)){
                        this.fieldValueObj[keys[count]] = addedFields[keys];
                    }
                }    
            }        
		}	

        this.template.querySelector('lightning-record-edit-form').submit(this.fieldValueObj);
        this.secNextItem = -1;
        this.end = 0;
    }


    handleSuccess(event){
        this.recordId = event.detail.id;

        if(this.recordId !== null){
            const evt = new ShowToastEvent({
                title: SAVE_TITLE,
                message: SAVE_MESSAGE,
                variant: "success",
            });
            this.dispatchEvent(evt);
            
            
                      
            if(this.redirectToTargetRecord){
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        //objectApiName: this.sobjectName, // objectApiName is optional
                        actionName: 'view'
                    }
                });
            }
            else if(this.refreshAfterSave || this.objectApiName !== undefined){
                this[NavigationMixin.Navigate](this.currentPageReference, true);
            }

            const fieldsetevent = new CustomEvent("fieldsetevent", { detail: event.detail });
            this.dispatchEvent(fieldsetevent);

        }
    }

    doReset(event){
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate](this.currentPageReference, true);
    }
    

}