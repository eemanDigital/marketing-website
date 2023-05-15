#include <stdlib.h>
#include <stdio.h>

// // struct node {
// //     int data;

// //     //pointer to links/address
// //     struct node *link;

// // };
// /*****************************************************************/

//  struct node{
//     int data;
//     struct node *next;
//  }; 

// void main()
// { 
//   //head stores  the address of the struct
// //set head to NULL/ newnode stores the address of the 
// //first node allocated by malloc/that is pointer to node 

// struct node *head,*newnode,*temp; 
// head = 0; int choice;  
// while(choice)
// {//allocate memory to the structure using malloc
// newnode = (struct node *)malloc(sizeof(struct node));
// //memory has been allocated but no data yet.Now, ask user to send input


// scanf("%d", &newnode->data); //ask user to enter input
// newnode->next = 0;
// //we store the address of newnode into head/you set a condition
// //this condition is required to avoid breaking the link/address
// if(head == 0)
// {
//   head = temp = newnode;
// } 
// else
// //write how the program will execute continously/create new node
//  {

//   temp->next = newnode;
//   temp = newnode; 
//  }
//  printf("Do you want to continue? (0, 1");
//  scanf("%d", &choice);  
// }
//     temp = head;
// while (temp != 0)
// {
//     printf("%d", temp->data);
//     temp = temp->next;
// }
  
  
  
  
  
  
  
  
  
  
//    /*//pointer to struct node
//     struct  node *head = NULL;
    
//     head = (struct node *)malloc(sizeof(struct node));
//     head->data = 50;
//     head->link = NULL;

//     /* Note: the head pointer has a null value, to access the 
//         next node and to avoid 
//     /* leaving the head pointer fallow, set head link to current
//     */
//     /*struct node *next = malloc(sizeof (struct node));
//     next->data = 89;
//     head->link = next;

//     /******************FIRST METHOD TO UPDATE NODE**********************/

// //updating the list
//     /*struct node *next2 = malloc(sizeof(struct node));
//     next2->data = 90;
//     next2->link = NULL;
//     next->link = next2;


//     /******************SECOND METHOD**********************/
//    // printf("%d", next2->data);







// }
struct node {
  int data;
  struct node *link;
};

struct node* head = NULL;

void main()
{
  // while(1)
  // {



  //     printf("Single Link List Operation\n");
  //     printf("1. Append\n");
  //     printf("Single Link List Operation\n");
  //     printf("Single Link List Operation\n");
  //     printf("Single Link List Operation\n");
  //     printf("Single Link List Operation\n");
      
  // }

    struct node* temp;

 temp = (struct node*)malloc(sizeof(struct node));
  
  if(temp == NULL)
  {
    head = temp;
  }

  else
  {
printf("Enter the node pls\n");
scanf("%d", &temp->data);
temp->link = NULL;
}
      printf("%d\n", temp->data);
}




