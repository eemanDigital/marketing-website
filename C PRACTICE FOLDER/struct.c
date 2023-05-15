#include <stdio.h>

struct student 
{
    int roll_no;
    char name[20];
    float score;
};

void main()  
{
    int i;
    // struct student s1[3] = {21, "Luqman", 54.9};
    // struct student s2 = {223, "Tayo", 67.9};
    // struct student s3;
    struct student s[3]; 

    printf("Please enter your info: ");
    for (i = 0; i < 3; i++)
    {
        scanf("%d %s %f", &s[i].roll_no, &s[i].name, &s[i].score);
    }
        

    // scanf("%d", &s3.roll_no);
    // scanf("%s", &s3.name);
    // scanf("%f", &s3.score);



//     struct student s3 = {   
//     s3.roll_no = 24;
//     s3.name = "Asinmi";
//     s3.score = 98.0;
// };
for (i = 0; i < 3; i++)
{
    printf("%d %s %3f", s[i].roll_no, s[i].name, s[i].score);
    
}

    
}