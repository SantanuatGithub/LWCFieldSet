/**
    * @name:        FieldSetController   
    * @author:      Santanu Pal   
    * @date:        1 SEPT 2018
    * @description: This Apex Class is used to return the fields present in the Fieldset
**/

public with sharing class FieldSetController {
    
    
    /**
      * @name:        getFields   
      * @param(s):    recordId, sObjectName, fieldSetName
      * @return:      List<String>
      * @description: To return the fields from the Fieldset of the specified sObject
    **/
    @AuraEnabled(cacheable=true)
    public static List<String> getFields(String sObjectName, String fieldSetName) {
        Schema.sObjectType sObjectType = null;
        List<String> fieldList = new List<String>();
        
        try{
            /*if (!String.isBlank(recordId)) {
                sObjectType = Id.valueof(recordId).getsObjectType();
            }
            else*/
            if (!String.isBlank(sObjectName)) {
                sObjectType = Schema.getGlobalDescribe().get(sObjectName.toLowerCase());
            }

            Schema.DescribeSObjectResult sobjectDescribe = sObjectType.getDescribe();
            Map<String, Schema.FieldSet> fieldSetMap = sobjectDescribe.fieldSets.getMap();
            Schema.FieldSet fieldSet = fieldSetMap.get(fieldSetName);
            List<Schema.FieldSetMember> fieldSetMemberList = fieldSet.getFields();

            if(fieldSetMemberList <> NULL && !fieldSetMemberList.isEmpty()){
                for (Schema.FieldSetMember fsm : fieldSetMemberList) {
                    fieldList.add(fsm.getFieldPath());
                }
            }
            System.debug('fieldset--->'+sObjectName+'pppp--->'+fieldList);
            return fieldList;
        }catch(Exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
        
    } 
   
}