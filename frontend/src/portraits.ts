type Portrait = {
  image: string;
  source: string;
  author: string;
  license: string;
};
export const portraits: Record<string, Portrait> = {
  "Mahendra Singh Dhoni": {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/MS_Dhoni_2016.jpg",
    source: "https://commons.wikimedia.org/wiki/File:MS_Dhoni_2016.jpg",
    author: "Amardeep Singh",
    license: "by-sa/4.0",
  },
  "Shreyas Iyer": {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/Shreyas_Iyer_2021.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Shreyas_Iyer_2021.jpg",
    author: "247 Entertainment",
    license: "by/3.0",
  },
  "Jos Buttler": {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/b/b2/Jos_Buttler_2017.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Jos_Buttler_2017.jpg",
    author: "Ytfc23",
    license: "by-sa/4.0",
  },
  "Sunil Narine": {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sunil_Narine.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Sunil_Narine.jpg",
    author: "Kolkata Knight Riders - Official",
    license: "by/3.0",
  },
};
