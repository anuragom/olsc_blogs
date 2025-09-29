export const buildPagination = (page?:string,limit?:string) =>{
    const p = Math.max(1,parseInt(page || "1",10));
    const l = Math.max(1,Math.min(100,parseInt(limit || "10",10)));
    const skip = (p-1)*l;

    return {page:p,limit,skip};
}