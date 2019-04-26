/* lwcFieldSet.js*/

/**
 * CORE LWC LIBRARIES 
 **/
import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
/**
 * CUSTOM LABELS 
 **/
import SAVE from '@salesforce/label/c.fieldsetSave';
import CANCEL from '@salesforce/label/c.fieldsetCancel';
import SAVE_TITLE from '@salesforce/label/c.fieldsetSaveTitle';
import SAVE_MESSAGE from '@salesforce/label/c.fieldsetSaveMessage';
import NO_ACCESS from '@salesforce/label/c.fieldsetNoAccess';
import GENERAL_INFORMATION from '@salesforce/label/c.fieldsetGeneralInformation';

/**
 * CALLING APEX CLASS: FieldSetController 
 **/
import getFields from '@salesforce/apex/FieldSetController.getFields';


export default class LwcFieldSet extends NavigationMixin(LightningElement) {
    
    /*PUBLIC REACTIVE PROPERTIES*/
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

    /*PRIVATE REACTIVE PROPERTIES*/    
    @track columnProperty;
    @track fields;
    @track validFields = [];
    @track currentfields;
    @track error;
    //@track noSectionHeader;
    
    /*PRIVATE PROPERTIES*/ 
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
    loopSecFieldsCount = 0;
    

    @wire(CurrentPageReference)
    currentPageReference; 

    save = SAVE;
    cancel = CANCEL;
    generalInformation = GENERAL_INFORMATION;
          
    
    /*
        @name: connectedCallback - standard method
        @params: none
        @description: get the fields from the fieldset & set the layout columns.  
    */
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
     
    /*
        @name: currentRecordId - get method
        @params: none
        @description: returns the recordId if this component is not present in the Lightning record Page. This recordId is being sent by
                      Subscriber component.
    */
    get currentRecordId(){        
        if(this.objectApiName!== undefined && !this.readOnlyMode)
            return null;

        return this.recordId;
    }
    
    /*
        @name: saveButtonVisibility - get method
        @params: none
        @description: Save button will be visible for only in Lightning Record Page and in non-editable mode.
    */
    get saveButtonVisibility(){
        if(this.keepSaveButton && !this.readOnlyMode)
            return true;
        
        return false;
    }

    /*
        @name: firstSecLoop - get method
        @params: none
        @description: calling to slicedFields() method to slice the fields depends on section 
    */
    get firstSecLoop(){
       
        if(this.fields.includes(NO_ACCESS))
            this.calculateValidFields();

        if(!this.noSectionHeader)
            this.slicedfields();

        return true;
    }

    /*
        @name: checkValidFields - get method
        @params: none
        @description: to filtered the valid fields which are accessible to the end-user.
    */ 
    get checkValidFields(){
        for(let countField in this.fields){
            if(this.fields[countField] !== NO_ACCESS)
                this.validFields.push(this.fields[countField]);
        }      
        this.currentfields =  this.validFields;
        return true;
    }

    /*
        @name: calculateValidFields
        @params: none
        @description: to segregate the valid fields which are accessible to the end-user.
    */ 
    calculateValidFields(){
        if(this.loopSecFieldsCount === 0){
            for(let fieldsCount in this.section){
                if (Object.prototype.hasOwnProperty.call(this.section, fieldsCount)){
                    let tempSecFieldsCount = this.section[fieldsCount].value;
                    let loopSecFieldsCountLimit = +this.loopSecFieldsCount + +tempSecFieldsCount;
                    for(let countSecField = this.loopSecFieldsCount; countSecField<loopSecFieldsCountLimit; countSecField++){
                        if(this.fields[countSecField] === NO_ACCESS)
                            this.section[fieldsCount].value = this.section[fieldsCount].value - 1;
                        else
                            this.validFields.push(this.fields[countSecField]);
                    }                    
                    this.loopSecFieldsCount = tempSecFieldsCount;
                }
            }
        }
    }

    /*
        @name: slicedfields
        @params: none
        @description: to slice the fields depends on section base on sectionMap defined in connectedCallback() standard method.
    */  
    slicedfields(){
        this.start = this.end;
        this.secValue();
        if(this.start === 0){
            this.end = this.numberOfFields;
        }
        else
            this.end = +this.start + +this.numberOfFields;
 
       if(this.validFields && this.validFields.length)
            this.currentfields =  this.validFields.slice(this.start, this.end);
        else
            this.currentfields =  this.fields.slice(this.start, this.end);
        
    }

    /*
        @name: secValue
        @params: none
        @description: to determine the number of fields for each section. This method is being called from slicedfields() method
    */ 
    secValue(){
        this.secNextItem ++;
        this.numberOfFields = this.section[this.secNextItem].value;
    }
    
    /*
        @name: captureFieldValues
        @params: event
        @description: to capture and store the field values during on change event on the respective fields in the field set
    */ 
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

    /*
        @name: doSave
        @params: addedFields
        @description: save the record without using Apex Class
    */ 
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
                    outercount++;                 }  
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

    /*
        @name: handleSuccess
        @params: event
        @description: certain funationalities such as redirection after saving, showing toast message is being controlled 
                      by this method after saving.
    */ 
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

    /*
        @name: doReset
        @params: event
        @description: the page will be refreshed at the time of cancellation
    */
    doReset(event){
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate](this.currentPageReference, true);
    }   

}